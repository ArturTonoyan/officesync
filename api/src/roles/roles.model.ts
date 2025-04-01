import {
  Model,
  Column,
  DataType,
  Table,
  BelongsToMany,
} from 'sequelize-typescript';
import { User } from 'src/users/users.model';
import { UserRoles } from './user-roles.model';

interface RoleCreationAttrs {
  //! для создание модели необходимы тольок эти поля
  value: string;
  description: string;
}

@Table({ tableName: 'roles' })
export class Role extends Model<Role, RoleCreationAttrs> {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  id: string;

  @Column({
    type: DataType.STRING,
    allowNull: false, //! не может быть пустым если false
    unique: true,
  })
  value: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  description: string;

  //! делаем связь с таблицей User многие ко многим так как у одног
  //! пользователя может быть несколько ролей
  @BelongsToMany(() => User, () => UserRoles)
  users: User[];
}
