import { getCustomRepository, getRepository, In } from 'typeorm';
import Transaction from '../models/Transaction';

import csvParse from 'csv-parse';
import fs from 'fs';
import TransactionsRepository from '../repositories/TransactionsRepository';
import Category from '../models/Category';

interface CSV {
  title: string;
  type: 'income' | 'outcome';
  value: number;
  category: string;
}

class ImportTransactionsService {
  async execute(filePath: string): Promise<Transaction[]> {
    const transReposi = getCustomRepository(TransactionsRepository);
    const categoriesReposi = getRepository(Category);

    const contacts = fs.createReadStream(filePath);

    const trans: CSV[] = [];
    const categories: string[] = [];

    const parsers = csvParse({
      from_line: 2,
    });

    const parseCSV = contacts.pipe(parsers);

    parseCSV.on('data', async line => {
      const [title, value, type, category] = line.map((cell: string) =>
        cell.trim(),
      );

      if (!title || !type || !value) return;

      categories.push(category);

      trans.push({ title, type, value, category });
    });

    await new Promise(res => parseCSV.on('end', res));

    const existsCat = await categoriesReposi.find({
      where: {
        title: In(categories),
      },
    });

    const existTitle = existsCat.map((cat: Category) => cat.title);

    const addTitle = categories
      .filter(cat => !existTitle.includes(cat))
      .filter((value, index, self) => self.indexOf(value) == index);

    const newCat = categoriesReposi.create(
      addTitle.map(title => ({
        title,
      })),
    );

    console.log(categories);
    console.log(trans);

    await categoriesReposi.save(newCat);

    const finalCat = [...newCat, ...existsCat];

    const createTrans = transReposi.create(
      trans.map(trans => ({
        title: trans.title,
        value: trans.value,
        type: trans.type,
        category: finalCat.find(cat => cat.title == trans.category),
      })),
    );

    console.log(categories);
    console.log(trans);

    await transReposi.save(createTrans);
    await fs.promises.unlink(filePath);

    return createTrans;
  }
}

export default ImportTransactionsService;
