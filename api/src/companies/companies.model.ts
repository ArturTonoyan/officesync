import {
  Model,
  Column,
  DataType,
  Table,
  ForeignKey,
  HasMany,
} from 'sequelize-typescript';
import { Equipment } from 'src/equipments/equipments.model';
import { Floors } from 'src/floors/floors.model';
import { Office } from 'src/offices/offices.model';
import { User } from 'src/users/users.model';

interface CompanyCreationAttrs {
  //! для создание модели необходимы тольок эти поля
  name: string;
}

@Table({ tableName: 'companies' })
export class Company extends Model<Company, CompanyCreationAttrs> {
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
  phone: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  email: string;

  @Column({
    type: DataType.STRING,
  })
  inn: string;

  @Column({
    type: DataType.STRING,
  })
  adress: string;

  @Column({
    type: DataType.STRING,
  })
  image: string;

  @HasMany(() => Office)
  offices: Office[];

  @HasMany(() => User)
  users: User[];

  @HasMany(() => Equipment)
  eqipments: Equipment[];

  @HasMany(() => Floors)
  floors: Floors[];

  // @ForeignKey(() => User)
  // @Column({
  //   type: DataType.UUID,
  // })
  // userId: string;
}
