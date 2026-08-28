import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import * as uuid from 'uuid';

@Injectable()
export class FilesService {
  async createFile(file): Promise<string> {
    try {
      const fileName = `${uuid.v4()}${path.extname(file.originalname)}`; // Создаем уникальное имя файла
      const filePath = path.resolve(__dirname, '..', '..', 'uploads'); // Путь к папке uploads в корне проекта
      if (!fs.existsSync(filePath)) {
        fs.mkdirSync(filePath, { recursive: true }); // Создаем папку uploads, если она не существует
      }
      fs.writeFileSync(path.join(filePath, fileName), file.buffer); // Записываем файл в папку
      return fileName; // Возвращаем имя файла
    } catch (e) {
      throw new HttpException(
        'Произошла ошибка при записи файла',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async createVideo(file): Promise<string> {
    try {
      const fileName = `${uuid.v4()}${path.extname(file.originalname)}`; // Create a unique file name
      const filePath = path.resolve(__dirname, '..', '..', 'uploads'); // Path to the uploads/videos folder
      if (!fs.existsSync(filePath)) {
        fs.mkdirSync(filePath, { recursive: true }); // Create the videos folder if it doesn't exist
      }
      fs.writeFileSync(path.join(filePath, fileName), file.buffer); // Write the file to the folder
      return fileName; // Return the file name
    } catch (e) {
      throw new HttpException(
        'Error occurred while writing the video file',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
