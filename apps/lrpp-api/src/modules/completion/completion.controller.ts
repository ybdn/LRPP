import { Body, Controller, Post } from "@nestjs/common";
import { CompletionService } from "./completion.service";
import { GenerateCompletionDto } from "./dto/generate-completion.dto";

@Controller("completion")
export class CompletionController {
  constructor(private readonly completionService: CompletionService) {}

  @Post("document")
  generateDocument(@Body() dto: GenerateCompletionDto) {
    return this.completionService.generateDocument(dto);
  }
}
