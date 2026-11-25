import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from 'src/auth/auth.module';
import { LayoutController } from './layout.controller';
import { LayoutService } from './layout.service';

@Module({
  imports: [ConfigModule, AuthModule],
  controllers: [LayoutController],
  providers: [LayoutService],
})
export class LayoutModule {}
