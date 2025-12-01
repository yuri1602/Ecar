import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChargeCardsService } from './charge-cards.service';
import { ChargeCardsController } from './charge-cards.controller';
import { ChargeCard } from './entities/charge-card.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ChargeCard])],
  controllers: [ChargeCardsController],
  providers: [ChargeCardsService],
  exports: [ChargeCardsService],
})
export class ChargeCardsModule {}
