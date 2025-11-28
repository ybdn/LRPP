import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
} from "@nestjs/common";
import { PvService } from "./pv.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { AdminGuard } from "../auth/guards/admin.guard";

@Controller("pvs")
export class PvController {
  constructor(private readonly pvService: PvService) {}

  @Get()
  findAll() {
    return this.pvService.findAll();
  }

  @Get("frameworks")
  findAllFrameworks() {
    return this.pvService.findAllFrameworks();
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.pvService.findOne(id);
  }

  @Get(":id/sections")
  findSections(@Param("id") id: string) {
    return this.pvService.findSections(id);
  }

  @Get(":id/contents")
  findContent(@Param("id") id: string) {
    return this.pvService.findContent(id);
  }

  // ===== PV CRUD (Protected with Admin Guard) =====

  @Post()
  @UseGuards(JwtAuthGuard, AdminGuard)
  create(@Body() createPvDto: any) {
    return this.pvService.create(createPvDto);
  }

  @Put(":id")
  @UseGuards(JwtAuthGuard, AdminGuard)
  update(@Param("id") id: string, @Body() updatePvDto: any) {
    return this.pvService.update(id, updatePvDto);
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard, AdminGuard)
  remove(@Param("id") id: string) {
    return this.pvService.remove(id);
  }

  // ===== SECTION CRUD (Protected with Admin Guard) =====

  @Post(":id/sections")
  @UseGuards(JwtAuthGuard, AdminGuard)
  createSection(@Param("id") pvId: string, @Body() createSectionDto: any) {
    return this.pvService.createSection({ ...createSectionDto, pvId });
  }

  @Put("sections/:sectionId")
  @UseGuards(JwtAuthGuard, AdminGuard)
  updateSection(
    @Param("sectionId") id: string,
    @Body() updateSectionDto: any,
  ) {
    return this.pvService.updateSection(id, updateSectionDto);
  }

  @Delete("sections/:sectionId")
  @UseGuards(JwtAuthGuard, AdminGuard)
  removeSection(@Param("sectionId") id: string) {
    return this.pvService.removeSection(id);
  }

  @Put(":id/sections/reorder")
  @UseGuards(JwtAuthGuard, AdminGuard)
  reorderSections(
    @Param("id") pvId: string,
    @Body() body: { sections: { id: string; order: number }[] },
  ) {
    return this.pvService.reorderSections(pvId, body.sections);
  }

  // ===== FRAMEWORK CRUD (Protected with Admin Guard) =====

  @Put("frameworks/:id")
  @UseGuards(JwtAuthGuard, AdminGuard)
  updateFramework(@Param("id") id: string, @Body() updateFrameworkDto: any) {
    return this.pvService.updateFramework(id, updateFrameworkDto);
  }

  // ===== CONTENT CRUD (Protected with Admin Guard) =====

  @Put("contents/:id")
  @UseGuards(JwtAuthGuard, AdminGuard)
  updateContent(@Param("id") id: string, @Body() updateContentDto: any) {
    return this.pvService.updateContent(id, updateContentDto);
  }
}
