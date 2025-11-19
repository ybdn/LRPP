import { Controller, Post, Body, Get, Param, Patch } from '@nestjs/common';
import { ExamService } from './exam.service';
import { CreateExamDto } from './dto/create-exam.dto';

@Controller('exams')
export class ExamController {
  constructor(private readonly examService: ExamService) {}

  @Post()
  create(@Body() dto: CreateExamDto) {
    return this.examService.create(dto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.examService.findOne(id);
  }

  @Patch(':id/complete')
  complete(@Param('id') id: string) {
    return this.examService.complete(id);
  }
}
