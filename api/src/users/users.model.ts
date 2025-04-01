import {
  Model,
  Column,
  DataType,
  Table,
  BelongsToMany,
} from 'sequelize-typescript';
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

  //! делаем связь с таблицей Role многие ко многим так как у одног
  //! пользователя может быть несколько ролей
  @BelongsToMany(() => Role, () => UserRoles)
  roles: Role[];
}
