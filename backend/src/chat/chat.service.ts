import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/sequelize';
import { AskChatDto } from './dto/ask-chat.dto';
import { Company } from 'src/companies/companies.model';
import { Office } from 'src/offices/offices.model';
import { Floors } from 'src/floors/floors.model';
import { User } from 'src/users/users.model';
import { Equipment } from 'src/equipments/equipments.model';
import { Problem } from 'src/problems/problems.model';
import { To } from 'src/tos/tos.model';

type ChatTopic =
  | 'company'
  | 'offices'
  | 'floors'
  | 'users'
  | 'equipments'
  | 'problems'
  | 'tos';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(
    private readonly configService: ConfigService,
    @InjectModel(Company) private readonly companyRepository: typeof Company,
    @InjectModel(Office) private readonly officeRepository: typeof Office,
    @InjectModel(Floors) private readonly floorRepository: typeof Floors,
    @InjectModel(User) private readonly userRepository: typeof User,
    @InjectModel(Equipment)
    private readonly equipmentRepository: typeof Equipment,
    @InjectModel(Problem) private readonly problemRepository: typeof Problem,
    @InjectModel(To) private readonly toRepository: typeof To,
  ) {}

  async ask(dto: AskChatDto, companyId?: string, signal?: AbortSignal) {
    const topic = dto.topic as ChatTopic;
    const question = dto.question.trim();
    const startedAt = Date.now();

    if (!question) {
      this.logger.warn('Rejected chat request with empty question');
      throw new BadRequestException('Вопрос не может быть пустым');
    }

    this.logger.log(
      `Preparing chat answer topic=${topic}, companyId=${companyId || 'n/a'}, questionLength=${question.length}`,
    );

    const topicData = await this.getTopicData(topic, companyId);
    const preparedData = this.prepareContextData(topicData);

    const answer = await this.askOllama({
      topic,
      question,
      contextData: preparedData,
      signal,
    });

    this.logger.log(
      `Chat answer ready topic=${topic}, recordsCount=${Array.isArray(topicData) ? topicData.length : topicData ? 1 : 0}, durationMs=${Date.now() - startedAt}`,
    );

    return {
      topic,
      recordsCount: Array.isArray(topicData) ? topicData.length : 1,
      answer,
    };
  }

  private async getTopicData(topic: ChatTopic, companyId?: string) {
    const companyWhere = companyId ? { companyId } : undefined;

    switch (topic) {
      case 'company': {
        if (companyId) {
          return this.companyRepository.findOne({ where: { id: companyId } });
        }
        return this.companyRepository.findAll({ limit: 100 });
      }
      case 'offices': {
        return this.officeRepository.findAll({
          where: companyWhere,
          attributes: [
            'id',
            'name',
            'address',
            'phone',
            'email',
            'typeOwnership',
            'area',
            'cost',
          ],
          limit: 100,
        });
      }
      case 'floors': {
        return this.floorRepository.findAll({
          where: companyWhere,
          attributes: ['id', 'name', 'number', 'officeId'],
          include: [
            {
              model: Office,
              attributes: ['name', 'address'],
            },
          ],
          limit: 100,
        });
      }
      case 'users': {
        return this.userRepository.findAll({
          where: companyWhere,
          attributes: [
            'id',
            'name',
            'surname',
            'patronymic',
            'email',
            'position',
          ],
          include: [
            { model: Office, attributes: ['name'] },
            { model: Floors, attributes: ['name', 'number'] },
          ],
          limit: 100,
        });
      }
      case 'equipments': {
        return this.equipmentRepository.findAll({
          where: companyWhere,
          attributes: [
            'id',
            'name',
            'inventoryNumber',
            'type',
            'description',
            'cost',
            'state',
            'maxWarranty',
            'currentWarranty',
          ],
          include: [
            {
              model: User,
              attributes: ['name', 'surname', 'position'],
            },
            {
              model: Floors,
              attributes: ['name', 'number'],
            },
            {
              model: Office,
              attributes: ['name', 'address'],
            },
          ],
          limit: 100,
        });
      }
      case 'problems': {
        return this.problemRepository.findAll({
          where: companyWhere,
          attributes: [
            'id',
            'description',
            'status',
            'urgency',
            'equipmentId',
            'userId',
          ],
          include: [
            {
              model: Equipment,
              attributes: ['name', 'inventoryNumber', 'type'],
            },
            {
              model: User,
              attributes: ['name', 'surname'],
            },
          ],
          limit: 100,
        });
      }
      case 'tos': {
        return this.toRepository.findAll({
          where: companyWhere,
          attributes: [
            'id',
            'description',
            'status',
            'urgency',
            'equipmentId',
            'userId',
          ],
          include: [
            {
              model: Equipment,
              attributes: ['name', 'inventoryNumber', 'type'],
            },
            {
              model: User,
              attributes: ['name', 'surname'],
            },
          ],
          limit: 100,
        });
      }
      default:
        throw new BadRequestException('Неизвестная тема для чата');
    }
  }

  private prepareContextData(data: any) {
    const convertRecord = (record: any) => {
      const plain = record?.toJSON ? record.toJSON() : record;
      return this.sanitizeObject(plain, 2);
    };

    const prepared = Array.isArray(data)
      ? data.map(convertRecord)
      : convertRecord(data);

    // Компактный JSON: влезает больше записей в контекст модели
    const stringified = JSON.stringify(prepared);
    return stringified.length > 14000
      ? `${stringified.slice(0, 14000)}\n... [Данные обрезаны из-за лимита]`
      : stringified;
  }

  private sanitizeObject(value: any, depth: number) {
    if (value === null || value === undefined) {
      return value;
    }

    if (typeof value !== 'object') {
      return value;
    }

    if (Array.isArray(value)) {
      return value
        .slice(0, 100)
        .map((item) => this.sanitizeObject(item, depth - 1));
    }

    if (depth < 0) {
      return '[nested]';
    }

    const blockedKeys = new Set([
      'password',
      'createdAt',
      'updatedAt',
      'image',
      'planData',
      'contract',
      'elementId',
    ]);
    const result: Record<string, any> = {};

    Object.keys(value).forEach((key) => {
      if (blockedKeys.has(key)) {
        return;
      }
      result[key] = this.sanitizeObject(value[key], depth - 1);
    });

    return result;
  }

  private async askOllama(params: {
    topic: ChatTopic;
    question: string;
    contextData: string;
    signal?: AbortSignal;
  }) {
    const baseUrl = (
      this.configService.get<string>('OLLAMA_BASE_URL') ||
      'http://127.0.0.1:11434'
    ).replace(/\/$/, '');
    const model =
      this.configService.get<string>('OLLAMA_MODEL') ||
      'huihui_ai/qwen2.5-abliterate:7b';

    const systemPrompt = [
      'Ты корпоративный ассистент OfficeSync по данным компании.',
      'Отвечай ТОЛЬКО на русском языке, понятно и по делу.',
      'Не используй китайские иероглифы.',
      'Не выдумывай факты — опирайся только на переданный контекст.',
      'Если просят список или «все» записи — перечисли ВСЕ элементы из контекста нумерованным списком, не сокращай до одного примера.',
      'Для каждого пункта указывай важные поля: название, тип, инвентарный номер, состояние, офис/этаж, если они есть.',
      'В конце можно кратко подытожить количество.',
      'Если данных не хватает, честно скажи об этом.',
    ].join(' ');

    const userPrompt = `Тема: ${params.topic}\n\nКонтекст данных (JSON):\n${params.contextData}\n\nВопрос: ${params.question}\n\nОтветь на русском. Если вопрос про список — выдай полный список из контекста.`;

    try {
      const response = await fetch(`${baseUrl}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: params.signal,
        body: JSON.stringify({
          model,
          stream: false,
          options: {
            temperature: 0.2,
            num_predict: 1200,
          },
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(
          `Ollama request failed status=${response.status}, topic=${params.topic}, model=${model}`,
        );
        throw new InternalServerErrorException(
          `Ошибка Ollama: ${response.status} ${errorText}`,
        );
      }

      const data = await response.json();
      return (data?.message?.content as string) || 'Ответ не получен';
    } catch (error) {
      if (
        error?.name === 'AbortError' ||
        params.signal?.aborted
      ) {
        this.logger.warn(`Ollama request aborted topic=${params.topic}`);
        throw new BadRequestException('Генерация остановлена');
      }
      throw error;
    }
  }
}
