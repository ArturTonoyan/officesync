import {
  Model,
  Column,
  DataType,
  Table,
  ForeignKey,
  HasMany,
} from 'sequelize-typescript';
import { Company } from 'src/companies/companies.model';
import { Equipment } from 'src/equipments/equipments.model';
import { Office } from 'src/offices/offices.model';
import { User } from 'src/users/users.model';

interface FloorsCreationAttrs {
  //! для создание модели необходимы только эти поля
  name: string;
}

@Table({ tableName: 'floors' })
export class Floors extends Model<Floors, FloorsCreationAttrs> {
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
    type: DataType.INTEGER,
    allowNull: false,
    unique: true,
  })
  number: number;

  @ForeignKey(() => Office)
  @Column({
    type: DataType.UUID,
  })
  officeId: string;

  @ForeignKey(() => Company)
  @Column({
    type: DataType.UUID,
  })
  companyId: string;

  @HasMany(() => User)
  users: User[];

  @HasMany(() => Equipment)
  eqipments: Equipment[];
}
