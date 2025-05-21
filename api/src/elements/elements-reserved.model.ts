import {
  Model,
  Column,
  DataType,
  Table,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { User } from 'src/users/users.model';
import { Element } from './elements.model';

@Table({ tableName: 'elements_reserved', createdAt: false, updatedAt: false })
export class ElementsReserved extends Model<ElementsReserved> {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  id: string;

  @ForeignKey(() => User)
  @Column({
    type: DataType.UUID,
  })
  userId: string;

  @ForeignKey(() => Element)
  @Column({
    type: DataType.UUID,
  })
  elementId: string;

  @Column({
    type: DataType.STRING,
  })
  startTime: string;

  @Column({
    type: DataType.STRING,
  })
  endTime: string;

  @Column({
    type: DataType.STRING,
  })
  date: string;

  @BelongsTo(() => User)
  user: User;

  @BelongsTo(() => Element)
  element: Element;
}
