import { Controller, Post, Body } from "@nestjs/common";
import { ExerciseService } from "./exercise.service";
import { GenerateFillBlanksDto } from "./dto/generate-fill-blanks.dto";
import { CheckAnswersDto } from "./dto/check-answers.dto";

@Controller("exercises")
export class ExerciseController {
  constructor(private readonly exerciseService: ExerciseService) {}

  @Post("fill-blanks")
  generateFillBlanks(@Body() dto: GenerateFillBlanksDto) {
    return this.exerciseService.generateFillBlanks(dto);
  }

  @Post("check")
  checkAnswers(@Body() dto: CheckAnswersDto) {
    return this.exerciseService.checkAnswers(dto);
  }

  @Post("dictation")
  generateDictation(@Body() dto: { blockId: string }) {
    return this.exerciseService.generateDictation(dto.blockId);
  }
}
