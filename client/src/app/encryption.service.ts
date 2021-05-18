import { Injectable } from '@angular/core';
import SEAL from 'node-seal/allows_wasm_web_es';
import { BatchEncoder } from 'node-seal/implementation/batch-encoder';
import { CipherText } from 'node-seal/implementation/cipher-text';
import { Context } from 'node-seal/implementation/context';
import { Decryptor } from 'node-seal/implementation/decryptor';
import { Encryptor } from 'node-seal/implementation/encryptor';
import { PlainText } from 'node-seal/implementation/plain-text';
import { SEALLibrary } from 'node-seal/implementation/seal';

@Injectable({
  providedIn: 'root',
})
export class EncryptionService {
  private seal: SEALLibrary | null = null;
  private context: Context | null = null;
  private encoder: BatchEncoder | null = null;
  private encryptor: Encryptor | null = null;
  private decryptor: Decryptor | null = null;

  constructor() {
    SEAL().then((seal) => {
      this.seal = seal;
      const schemeType = seal.SchemeType.bfv;
      const securityLevel = seal.SecurityLevel.tc128;
      const polyModulusDegree = 4096;
      const bitSizes = [36, 36, 37];
      const bitSize = 20;
      const parms = seal.EncryptionParameters(schemeType);
      parms.setPolyModulusDegree(polyModulusDegree);
      parms.setCoeffModulus(
        seal.CoeffModulus.Create(polyModulusDegree, Int32Array.from(bitSizes))
      );
      parms.setPlainModulus(
        seal.PlainModulus.Batching(polyModulusDegree, bitSize)
      );
      this.context = seal.Context(parms, true, securityLevel);
      this.encoder = seal.BatchEncoder(this.context);
      const keyGenerator = seal.KeyGenerator(this.context);
      const publicKey = keyGenerator.createPublicKey();
      const secretKey = keyGenerator.secretKey();
      this.encryptor = seal.Encryptor(this.context, publicKey);
      this.decryptor = seal.Decryptor(this.context, secretKey);
    });
  }

  public encryptNumber(num: number): string {
    if (!this.seal || !this.encryptor || !this.encoder) {
      throw Error('Failed to encrypt');
    }

    const singletonArray = Int32Array.from([num]);
    const plainText = this.encoder.encode(singletonArray) as PlainText;
    const cipherText = this.encryptor.encrypt(plainText) as CipherText;
    return cipherText.save();
  }

  public decryptNumber(encryptedNum: string): number {
    if (!this.seal || !this.decryptor || !this.context || !this.encoder ) {
      throw Error('Failed to decrypt');
    }

    const cipherText = this.seal.CipherText();
    cipherText.load(this.context, encryptedNum);
    const plainText= this.decryptor.decrypt(cipherText) as PlainText;
    const decoded = this.encoder.decode(plainText) as Int32Array;
    return decoded[0];
  }
}
