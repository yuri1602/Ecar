import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChargeCard } from './entities/charge-card.entity';
import { CreateChargeCardDto, UpdateChargeCardDto } from './dto/charge-card.dto';

@Injectable()
export class ChargeCardsService {
  constructor(
    @InjectRepository(ChargeCard)
    private readonly chargeCardRepository: Repository<ChargeCard>,
  ) {}

  async create(createChargeCardDto: CreateChargeCardDto): Promise<ChargeCard> {
    // Check if card number already exists
    const existingCard = await this.chargeCardRepository.findOne({
      where: { cardNumber: createChargeCardDto.cardNumber },
    });

    if (existingCard) {
      throw new BadRequestException('Card number already exists');
    }

    const chargeCard = this.chargeCardRepository.create(createChargeCardDto);
    return await this.chargeCardRepository.save(chargeCard);
  }

  async findAll(): Promise<ChargeCard[]> {
    return await this.chargeCardRepository.find({
      relations: ['vehicle'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<ChargeCard> {
    const chargeCard = await this.chargeCardRepository.findOne({
      where: { id },
      relations: ['vehicle'],
    });

    if (!chargeCard) {
      throw new NotFoundException(`Charge card with ID ${id} not found`);
    }

    return chargeCard;
  }

  async findByCardNumber(cardNumber: string): Promise<ChargeCard | null> {
    return await this.chargeCardRepository.findOne({
      where: { cardNumber, isActive: true },
      relations: ['vehicle'],
    });
  }

  async update(id: string, updateChargeCardDto: UpdateChargeCardDto): Promise<ChargeCard> {
    const chargeCard = await this.findOne(id);

    // If updating card number, check for duplicates
    if (updateChargeCardDto.cardNumber && updateChargeCardDto.cardNumber !== chargeCard.cardNumber) {
      const existingCard = await this.chargeCardRepository.findOne({
        where: { cardNumber: updateChargeCardDto.cardNumber },
      });

      if (existingCard) {
        throw new BadRequestException('Card number already exists');
      }
    }

    Object.assign(chargeCard, updateChargeCardDto);
    return await this.chargeCardRepository.save(chargeCard);
  }

  async remove(id: string): Promise<void> {
    const chargeCard = await this.findOne(id);
    await this.chargeCardRepository.remove(chargeCard);
  }
}
