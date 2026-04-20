# Чат с Groq в OfficeSync

Ниже собрана полная документация по чату: какие файлы участвуют, как идет запрос, и какие данные попадают в модель.

## 1) Общая схема

1. Пользователь открывает страницу чата в админке.
2. Выбирает тему (например, оборудование или сотрудники) и задает вопрос.
3. Frontend отправляет POST-запрос в backend: `/chat/ask`.
4. Backend:
   - проверяет JWT;
   - получает данные из выбранной таблицы;
   - очищает и ограничивает контекст;
   - отправляет запрос в Groq Chat Completions;
   - возвращает ответ на frontend.
5. Frontend показывает ответ в ленте сообщений.

---

## 2) Backend: DTO

Файл: `src/chat/dto/ask-chat.dto.ts`

```ts
export class AskChatDto {
  topic: string;
  question: string;
}
```

Что это делает:

- `topic` — тема/таблица, из которой берем данные.
- `question` — вопрос пользователя.

---

## 3) Backend: контроллер

Файл: `src/chat/chat.controller.ts`

```ts
import {
  BadRequestException,
  Body,
  Controller,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { AskChatDto } from './dto/ask-chat.dto';
import { ChatService } from './chat.service';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('ask')
  @UseGuards(JwtAuthGuard)
  async ask(@Body() dto: AskChatDto, @Req() request: any) {
    const companyId = request?.user?.companyId;

    if (!dto?.topic || !dto?.question) {
      throw new BadRequestException('Требуются поля topic и question');
    }

    return this.chatService.ask(dto, companyId);
  }
}
```

Что важно:

- Эндпоинт защищен JWT (`@UseGuards(JwtAuthGuard)`).
- Если у пользователя нет `companyId`, запрос все равно работает (в сервис передается `undefined`).

---

## 4) Backend: модуль

Файл: `src/chat/chat.module.ts`

```ts
import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { ConfigModule } from '@nestjs/config';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { Company } from 'src/companies/companies.model';
import { Office } from 'src/offices/offices.model';
import { Floors } from 'src/floors/floors.model';
import { User } from 'src/users/users.model';
import { Equipment } from 'src/equipments/equipments.model';
import { Problem } from 'src/problems/problems.model';
import { To } from 'src/tos/tos.model';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  controllers: [ChatController],
  providers: [ChatService],
  imports: [
    ConfigModule,
    AuthModule,
    SequelizeModule.forFeature([
      Company,
      Office,
      Floors,
      User,
      Equipment,
      Problem,
      To,
    ]),
  ],
})
export class ChatModule {}
```

Что это дает:

- У сервиса есть доступ к нужным Sequelize-моделям.
- Можно выбирать данные из таблиц по теме.

---

## 5) Backend: сервис (основная логика)

Файл: `src/chat/chat.service.ts`

```ts
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
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

  async ask(dto: AskChatDto, companyId?: string) {
    const topic = dto.topic as ChatTopic;
    const question = dto.question.trim();

    if (!question) {
      throw new BadRequestException('Вопрос не может быть пустым');
    }

    const topicData = await this.getTopicData(topic, companyId);
    const preparedData = this.prepareContextData(topicData);

    const answer = await this.askGroq({
      topic,
      question,
      contextData: preparedData,
    });

    return {
      topic,
      recordsCount: Array.isArray(topicData) ? topicData.length : 1,
      answer,
    };
  }

  private async getTopicData(topic: ChatTopic, companyId?: string) {
    switch (topic) {
      case 'company': {
        if (companyId) {
          return this.companyRepository.findOne({ where: { id: companyId } });
        }
        return this.companyRepository.findAll({ limit: 100 });
      }
      case 'offices': {
        return this.officeRepository.findAll({
          where: companyId ? { companyId } : undefined,
          include: { all: true },
          limit: 100,
        });
      }
      case 'floors': {
        return this.floorRepository.findAll({
          where: companyId ? { companyId } : undefined,
          include: { all: true },
          limit: 100,
        });
      }
      case 'users': {
        return this.userRepository.findAll({
          where: companyId ? { companyId } : undefined,
          include: { all: true },
          limit: 100,
        });
      }
      case 'equipments': {
        return this.equipmentRepository.findAll({
          where: companyId ? { companyId } : undefined,
          include: { all: true },
          limit: 100,
        });
      }
      case 'problems': {
        return this.problemRepository.findAll({
          where: companyId ? { companyId } : undefined,
          include: { all: true },
          limit: 100,
        });
      }
      case 'tos': {
        return this.toRepository.findAll({
          where: companyId ? { companyId } : undefined,
          include: { all: true },
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

    const stringified = JSON.stringify(prepared, null, 2);
    return stringified.length > 18000
      ? `${stringified.slice(0, 18000)}\n... [Данные обрезаны из-за лимита]`
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
        .slice(0, 20)
        .map((item) => this.sanitizeObject(item, depth - 1));
    }

    if (depth < 0) {
      return '[nested]';
    }

    const blockedKeys = new Set(['password', 'createdAt', 'updatedAt']);
    const result: Record<string, any> = {};

    Object.keys(value).forEach((key) => {
      if (blockedKeys.has(key)) {
        return;
      }
      result[key] = this.sanitizeObject(value[key], depth - 1);
    });

    return result;
  }

  private async askGroq(params: {
    topic: ChatTopic;
    question: string;
    contextData: string;
  }) {
    const apiKey = this.configService.get<string>('GROQ_API_KEY');
    const model =
      this.configService.get<string>('GROQ_MODEL') || 'openai/gpt-oss-120b';

    if (!apiKey) {
      throw new InternalServerErrorException(
        'Не задан GROQ_API_KEY в переменных окружения',
      );
    }

    const response = await fetch(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          temperature: 0.2,
          messages: [
            {
              role: 'system',
              content:
                'Ты корпоративный ассистент. Отвечай строго на русском языке, коротко и по делу. Не выдумывай факты. Если данных в контексте не хватает, честно сообщи об этом.',
            },
            {
              role: 'user',
              content: `Тема: ${params.topic}\n\nКонтекст данных:\n${params.contextData}\n\nВопрос: ${params.question}`,
            },
          ],
        }),
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new InternalServerErrorException(
        `Ошибка Groq: ${response.status} ${errorText}`,
      );
    }

    const data = await response.json();
    return data?.choices?.[0]?.message?.content || 'Ответ не получен';
  }
}
```

Ключевые идеи:

- Метод `getTopicData` выбирает таблицу по `topic`.
- Если `companyId` есть, данные фильтруются по компании.
- Если `companyId` нет, запросы идут без фильтра (с лимитом).
- Перед отправкой в модель данные очищаются (`sanitizeObject`) и ограничиваются по объему (`prepareContextData`).
- Запрос к LLM идет через Groq в формате OpenAI-compatible API.

---

## 6) Подключение в AppModule

Файл: `src/app.module.ts` (фрагмент)

```ts
import { ChatModule } from './chat/chat.module';

@Module({
  imports: [
    // ...
    ChatModule,
  ],
})
export class AppModule {}
```

Без этого Nest не зарегистрирует контроллер `/chat/ask`.

---

## 7) Переменные окружения

Файл: `.env` (фрагмент)

```env
GROQ_API_KEY=your_groq_api_key
GROQ_MODEL=openai/gpt-oss-120b
```

Рекомендации:

- Никогда не коммитить настоящий ключ в git.
- Если ключ был опубликован, сразу ротировать.

---

## 8) Frontend: API-запрос

Файл: `../web/src/api/apirequests.js` (фрагмент)

```js
//! запрос к AI-чату
export const apiAskChat = async (data) => {
  return await apiRequest('post', `/chat/ask`, data);
};
```

Что отправляется:

```json
{
  "topic": "equipments",
  "question": "Сколько оборудования требует обслуживания?"
}
```

---

## 9) Frontend: страница чата

Файл: `../web/src/pages/Admin/Chat/Chat.jsx`

```jsx
import { useMemo, useState } from 'react';
import styles from './Chat.module.scss';
import { apiAskChat } from '../../../api/apirequests';

const TOPICS = [
  { value: 'company', label: 'Компания' },
  { value: 'offices', label: 'Офисы' },
  { value: 'floors', label: 'Этажи' },
  { value: 'users', label: 'Сотрудники' },
  { value: 'equipments', label: 'Оборудование' },
  { value: 'problems', label: 'Заявки на ремонт' },
  { value: 'tos', label: 'ТО' },
];

function Chat() {
  const [topic, setTopic] = useState('equipments');
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content:
        'Привет! Выберите тему, задайте вопрос, и я отвечу по данным выбранной таблицы.',
    },
  ]);

  const topicTitle = useMemo(
    () => TOPICS.find((item) => item.value === topic)?.label || 'Тема',
    [topic],
  );

  const handleSend = async () => {
    const trimmedQuestion = question.trim();
    if (!trimmedQuestion || loading) {
      return;
    }

    const userMessage = { role: 'user', content: trimmedQuestion };
    setMessages((prev) => [...prev, userMessage]);
    setQuestion('');
    setLoading(true);

    try {
      const response = await apiAskChat({ topic, question: trimmedQuestion });
      const answer =
        response?.data?.answer || 'Не удалось получить ответ от сервера.';

      setMessages((prev) => [...prev, { role: 'assistant', content: answer }]);
    } catch (error) {
      const serverMessage =
        error?.response?.data?.message ||
        'Произошла ошибка при запросе к чату. Попробуйте еще раз.';

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: serverMessage,
          isError: true,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    handleSend();
  };

  return (
    <div className={styles.Chat}>
      <h1>AI-чат по данным компании</h1>

      <div className={styles.content}>
        <div className={styles.toolbar}>
          <label htmlFor="topic">Тема:</label>
          <select
            id="topic"
            value={topic}
            onChange={(event) => setTopic(event.target.value)}
          >
            {TOPICS.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
          <div className={styles.currentTopic}>Выбрано: {topicTitle}</div>
        </div>

        <div className={styles.messages}>
          {messages.map((message, index) => (
            <div
              key={`${message.role}-${index}`}
              className={`${styles.message} ${
                message.role === 'user' ? styles.user : styles.assistant
              } ${message.isError ? styles.error : ''}`}
            >
              <span className={styles.role}>
                {message.role === 'user' ? 'Вы' : 'Ассистент'}
              </span>
              <p>{message.content}</p>
            </div>
          ))}
          {loading && (
            <div className={`${styles.message} ${styles.assistant}`}>
              <span className={styles.role}>Ассистент</span>
              <p>Думаю над ответом...</p>
            </div>
          )}
        </div>

        <form className={styles.inputBox} onSubmit={handleSubmit}>
          <textarea
            placeholder="Например: Сколько сотрудников в компании и на каких этажах больше всего людей?"
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
          />
          <button type="submit" disabled={loading || !question.trim()}>
            {loading ? 'Отправка...' : 'Отправить'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Chat;
```

---

## 10) Маршрут и меню

Маршрут в `../web/src/App.js`:

```jsx
<Route path="chat" element={<Chat />}></Route>
```

Пункт меню в `../web/src/pages/Admin/LeftMenu/LeftMenu.jsx`:

```js
{
  icon: paramIcon,
  title: "AI-чат",
  navigate: "/admin/chat",
}
```

---

## 11) Ручная проверка через curl

```bash
curl https://api.groq.com/openai/v1/chat/completions -s \
-H "Content-Type: application/json" \
-H "Authorization: Bearer YOUR_GROQ_API_KEY" \
-d '{
  "model": "openai/gpt-oss-120b",
  "messages": [
    {
      "role": "user",
      "content": "Please briefly explain the importance of fast AI inference."
    }
  ]
}'
```

---

## 12) Частые причины ошибок

1. `Не задан GROQ_API_KEY`:

   - Проверь переменную в `.env`.
   - Перезапусти backend после изменения `.env`.

2. `Ошибка Groq: 401`:

   - Ключ недействителен или был отозван.

3. `Требуются поля topic и question`:

   - Frontend отправил пустое тело или неверные поля.

4. Ответ пустой:
   - Проверь, что `choices[0].message.content` приходит в ответе Groq.

---

## 13) Идеи улучшения

- Сохранять историю диалога и отправлять последние N сообщений в модель.
- Добавить точечные промпты для каждой темы (`users`, `equipments` и т.д.).
- Ограничить доступ к теме `company` или всем темам по ролям.
- Добавить кеширование по (topic, question) на короткое время.
