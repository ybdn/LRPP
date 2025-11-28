import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import {
  Ticket,
  TicketStatus,
  TicketSeverity,
} from "@/common/entities/ticket.entity";
import { CreateTicketDto } from "./dto/create-ticket.dto";
import { UpdateTicketDto } from "./dto/update-ticket.dto";
import { User } from "@/common/entities";

@Injectable()
export class TicketService {
  constructor(
    @InjectRepository(Ticket)
    private readonly ticketRepo: Repository<Ticket>,
  ) {}

  async create(dto: CreateTicketDto, user?: User | null) {
    const ticket = this.ticketRepo.create({
      ...dto,
      status: TicketStatus.OPEN,
      severity: dto.severity || TicketSeverity.MEDIUM,
      userId: user?.id || null,
      reporterName: dto.reporterName || user?.name || null,
      contactEmail: dto.contactEmail || user?.email || null,
    });
    return this.ticketRepo.save(ticket);
  }

  async findAll() {
    return this.ticketRepo.find({
      order: { createdAt: "DESC" },
    });
  }

  async updateStatus(id: string, dto: UpdateTicketDto) {
    const ticket = await this.ticketRepo.findOne({ where: { id } });
    if (!ticket) {
      throw new NotFoundException("Ticket not found");
    }

    ticket.status = dto.status;
    if (dto.severity) {
      ticket.severity = dto.severity;
    }

    return this.ticketRepo.save(ticket);
  }
}
