import {
  Model,
  Column,
  DataType,
  ForeignKey,
  Table,
  HasMany,
} from 'sequelize-typescript';
import { Company } from 'src/companies/companies.model';
import { Equipment } from 'src/equipments/equipments.model';
import { Floors } from 'src/floors/floors.model';
import { User } from 'src/users/users.model';

interface OfficeCreationAttrs {
  name: string;
  companyId: string;
}

@Table({ tableName: 'offices' })
export class Office extends Model<Office, OfficeCreationAttrs> {
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
  address: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  phone: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  email: string;

  @ForeignKey(() => Company)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  companyId: string;

  @ForeignKey(() => User)
  @Column({
    type: DataType.UUID,
  })
  directorId: string;

  @HasMany(() => User)
  users: User[];

  @HasMany(() => Floors)
  floors: Floors[];

  @HasMany(() => Equipment)
  eqipments: Equipment[];

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  typeOwnership: string;

  @ForeignKey(() => User)
  @Column({
    type: DataType.UUID,
  })
  renterId: string;

  @Column({
    type: DataType.STRING,
  })
  contract: string;

  @Column({
    type: DataType.STRING,
  })
  dateStart: string;

  @Column({
    type: DataType.STRING,
  })
  dateEnd: string;

  @Column({
    type: DataType.INTEGER,
  })
  cost: number;

  @Column({
    type: DataType.STRING,
  })
  renterContact: string;

  @Column({
    type: DataType.INTEGER,
  })
  area: number;
}
