import { Injectable } from '@nestjs/common';
import { Context } from 'node-seal/implementation/context';
import { SEALLibrary } from 'node-seal/implementation/seal';
import SEAL from 'node-seal';
import { Evaluator } from 'node-seal/implementation/evaluator';
import { PointsRequest } from 'src/model/points-request';
import { CipherText } from 'node-seal/implementation/cipher-text';

@Injectable()
export class ComputeService {
  private evaluator: Evaluator | null = null;
  private context: Context | null = null;
  private seal: SEALLibrary | null = null;

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
        seal.CoeffModulus.Create(polyModulusDegree, Int32Array.from(bitSizes)),
      );
      parms.setPlainModulus(
        seal.PlainModulus.Batching(polyModulusDegree, bitSize),
      );
      this.context = seal.Context(parms, true, securityLevel);
      this.evaluator = seal.Evaluator(this.context);
    });
  }

  public compute(points: PointsRequest): string {
      if (!this.context || !this.evaluator || !this.seal) {
          throw new Error("Failed to evaluate");
      }

      const cipherTextX1 = this.seal.CipherText();
      const cipherTextY1 = this.seal.CipherText();
      const cipherTextX2 = this.seal.CipherText();
      const cipherTextY2 = this.seal.CipherText();

      cipherTextX1.load(this.context, points.encX1);
      cipherTextY1.load(this.context, points.encY1);
      cipherTextX2.load(this.context, points.encX2);
      cipherTextY2.load(this.context, points.encY2);

      const dx = this.evaluator.sub(cipherTextX1, cipherTextX2) as CipherText;
      const dy = this.evaluator.sub(cipherTextY1, cipherTextY2) as CipherText;
      const powX = this.evaluator.multiply(dx, dx) as CipherText;
      const powY = this.evaluator.multiply(dy, dy) as CipherText;
      const sum = this.evaluator.add(powX, powY) as CipherText;

      return sum.save(); 
  }
}
