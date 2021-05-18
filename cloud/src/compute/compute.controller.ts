import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { DistanceResponse } from 'src/model/distance-response';
import { PointsRequest } from 'src/model/points-request';
import { ComputeService } from './compute.service';

@Controller('cloud')
export class ComputeController {
  constructor(private computeService: ComputeService) {}

  @Post()
  @HttpCode(201)
  public compute(@Body() reqBody: PointsRequest): DistanceResponse {
    return {
      encValue: this.computeService.compute(reqBody),
    };
  }
}
