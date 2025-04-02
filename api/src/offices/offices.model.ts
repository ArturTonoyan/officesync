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

  @HasMany(() => User)
  users: User[];

  @HasMany(() => Floors)
  floors: Floors[];

  @HasMany(() => Equipment)
  eqipments: Equipment[];
}
