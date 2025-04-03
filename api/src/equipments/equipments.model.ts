import {
  Model,
  Column,
  DataType,
  ForeignKey,
  Table,
  HasMany,
} from 'sequelize-typescript';
import { Company } from 'src/companies/companies.model';
import { Element } from 'src/elements/elements.model';
import { Floors } from 'src/floors/floors.model';
import { Office } from 'src/offices/offices.model';
import { User } from 'src/users/users.model';

interface EquipmentCreationAttrs {
  name: string;
  companyId: string;
}

@Table({ tableName: 'equipments' })
export class Equipment extends Model<Equipment, EquipmentCreationAttrs> {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  id: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  name: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  inventoryNumber: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  type: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  description: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  cost: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  maxWarranty: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  currentWarranty: number;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  state: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  image: string;

  @ForeignKey(() => User)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  userId: string;

  @ForeignKey(() => Floors)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  floorId: string;

  @ForeignKey(() => Office)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  officeId: string;

  @ForeignKey(() => Company)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  companyId: string;

  @ForeignKey(() => Element)
  @Column({
    type: DataType.UUID,
    allowNull: true,
  })
  elementId: string;

  // @HasMany(() => To)
  // tos: To[];

  // @HasMany(() => Problem)
  // problems: Problem[];
}
