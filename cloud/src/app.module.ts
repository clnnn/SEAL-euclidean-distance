import { Module } from '@nestjs/common';
import { ComputeController } from './compute/compute.controller';
import { ComputeService } from './compute/compute.service';


@Module({
  imports: [],
  controllers: [ComputeController],
  providers: [ComputeService],
})
export class AppModule {}
