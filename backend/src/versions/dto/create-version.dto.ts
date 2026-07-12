import { IsNotEmpty, IsString, IsInt, IsArray, ArrayMinSize } from 'class-validator';

export class CreateVersionDto {
  @IsInt()
  @IsNotEmpty()
  projectId: number;

  @IsString()
  @IsNotEmpty()
  version: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  // Указываем, что это массив строк, и он должен содержать как минимум 1 элемент
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1, { message: 'Версия должна содержать хотя бы одно изменение' })
  changes: string[];
}