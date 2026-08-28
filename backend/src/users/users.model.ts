import {
  Model,
  Column,
  DataType,
  Table,
  BelongsToMany,
  HasMany,
  ForeignKey,
  HasOne,
  BelongsTo,
} from 'sequelize-typescript';
import { Company } from 'src/companies/companies.model';
import { Element } from 'src/elements/elements.model';
import { Equipment } from 'src/equipments/equipments.model';
import { Floors } from 'src/floors/floors.model';
import { Office } from 'src/offices/offices.model';
import { Problem } from 'src/problems/problems.model';
import { Role } from 'src/roles/roles.model';
import { UserRoles } from 'src/roles/user-roles.model';

interface UserCreationAttrs {
  //! для создание модели необходимы тольок эти поля
  email: string;
  password: string;
}

@Table({ tableName: 'users' })
export class User extends Model<User, UserCreationAttrs> {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  id: string;

  @Column({
    type: DataType.STRING,
    allowNull: true, //! не может быть пустым если false
  })
  name: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  surname: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  patronymic: string;

  @Column({
    type: DataType.STRING,
    unique: true, //! должен быть уникальным
    allowNull: false, //! не может быть пустым
  })
  email: string;

  @Column({
    type: DataType.STRING,
    allowNull: false, //! не может быть пустым
  })
  password: string;

  @Column({
    type: DataType.STRING,
  })
  image: string;

  @Column({
    type: DataType.STRING,
  })
  position: string;

  //! делаем связь с таблицей Role многие ко многим так как у одног
  //! пользователя может быть несколько ролей
  @BelongsToMany(() => Role, () => UserRoles)
  roles: Role[];

  @ForeignKey(() => Company)
  @Column({
    type: DataType.UUID,
    allowNull: true,
  })
  companyId: string;

  @ForeignKey(() => Office)
  @Column({
    type: DataType.UUID,
    allowNull: true,
  })
  officeId: string;

  @ForeignKey(() => Floors)
  @Column({
    type: DataType.UUID,
    allowNull: true,
  })
  floorId: string;

  @HasMany(() => Equipment)
  eqipments: Equipment[];

  @HasMany(() => Problem)
  problems: Problem[];

  @BelongsTo(() => Office)
  office: Office;

  @BelongsTo(() => Floors)
  floor: Floors;
}
