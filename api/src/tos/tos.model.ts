import {
  Model,
  Column,
  DataType,
  ForeignKey,
  Table,
  BelongsTo,
} from 'sequelize-typescript';
import { Company } from 'src/companies/companies.model';
import { Equipment } from 'src/equipments/equipments.model';
import { Problem } from 'src/problems/problems.model';
import { User } from 'src/users/users.model';

interface ToCreationAttrs {
  name: string;
  companyId: string;
}

@Table({ tableName: 'tos' })
export class To extends Model<To, ToCreationAttrs> {
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

  @ForeignKey(() => Company)
  @Column({
    type: DataType.UUID,
  })
  companyId: string;

  @ForeignKey(() => Problem)
  @Column({
    type: DataType.UUID,
  })
  problemId: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  description: string;

  @ForeignKey(() => Equipment)
  @Column({
    type: DataType.UUID,
  })
  equipmentId: string;

  @Column({
    type: DataType.STRING,
  })
  status: string;

  @Column({
    type: DataType.STRING,
  })
  urgency: string;

  @Column({
    type: DataType.STRING,
  })
  image: string;

  @BelongsTo(() => User)
  user: User;

  @BelongsTo(() => Company)
  company: Company;

  @BelongsTo(() => Equipment)
  equipment: Equipment;

  @BelongsTo(() => Problem)
  problem: Problem;
}
