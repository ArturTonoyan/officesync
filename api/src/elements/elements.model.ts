import {
  Model,
  Column,
  DataType,
  Table,
  BelongsToMany,
  HasMany,
  ForeignKey,
} from 'sequelize-typescript';
import { Company } from 'src/companies/companies.model';
import { Equipment } from 'src/equipments/equipments.model';
import { Floors } from 'src/floors/floors.model';
import { Office } from 'src/offices/offices.model';
import { Role } from 'src/roles/roles.model';

interface ElementCreationAttrs {
  //! для создание модели необходимы тольок эти поля
  floorId: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  zIndex: number;
  scaleX: number;
  scaleY: number;
  isLocked: boolean;
}

@Table({ tableName: 'elements' })
export class Element extends Model<Element, ElementCreationAttrs> {
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
    allowNull: true, //! не может быть пустым если false
  })
  type: string;

  @ForeignKey(() => Equipment)
  @Column({
    type: DataType.UUID,
    allowNull: true,
  })
  equipmentId: string;

  @ForeignKey(() => Floors)
  @Column({
    type: DataType.UUID,
    allowNull: true,
  })
  floorId: string;

  @Column({
    type: DataType.STRING,
    allowNull: true, //! не может быть пустым если false
  })
  image: string;

  @Column({
    type: DataType.FLOAT,
    allowNull: true, //! не может быть пустым если false
  })
  x: number;

  @Column({
    type: DataType.FLOAT,
    allowNull: true, //! не может быть пустым если false
  })
  y: number;

  @Column({
    type: DataType.FLOAT,
    allowNull: true, //! не может быть пустым если false
  })
  width: number;

  @Column({
    type: DataType.FLOAT,
    allowNull: true, //! не может быть пустым если false
  })
  height: number;

  @Column({
    type: DataType.FLOAT,
    allowNull: true, //! не может быть пустым если false
  })
  rotation: number;

  @Column({
    type: DataType.FLOAT,
    allowNull: true, //! не может быть пустым если false
  })
  scaleX: number;

  @Column({
    type: DataType.FLOAT,
    allowNull: true, //! не может быть пустым если false
  })
  scaleY: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: true, //! не может быть пустым если false
  })
  zIndex: number;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: true, //! не может быть пустым если false
  })
  isLocked: boolean;
}
