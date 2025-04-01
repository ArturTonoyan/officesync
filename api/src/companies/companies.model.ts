import { Model, Column, DataType, Table } from 'sequelize-typescript';

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
}
