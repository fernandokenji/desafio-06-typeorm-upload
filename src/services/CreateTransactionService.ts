import { getRepository } from 'typeorm';
import AppError from '../errors/AppError';

import { getCustomRepository } from 'typeorm';
import Category from '../models/Category';
import Transaction from '../models/Transaction';
import TransactionsRepository from '../repositories/TransactionsRepository';

interface Request {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  category: string;
}

class CreateTransactionService {
  public async execute({
    title,
    value,
    type,
    category,
  }: Request): Promise<Transaction> {
    const transRepository = getCustomRepository(TransactionsRepository);
    const categoryRepository = getRepository(Category);

    const { total } = await transRepository.getBalance();
    if (type !== 'outcome' && type !== 'income') {
      throw new AppError('Operação inválida');
    }

    if (type === 'outcome' && total < value) {
      throw new AppError('Você não tem saldo disponível para realizar essa transação');
    }

    let transCategory = await categoryRepository.findOne({
      where: {
        title: category,
      },
    });

    if (!transCategory) {
      transCategory = categoryRepository.create({ title: category });

      await categoryRepository.save(transCategory);
    }

    const trans = transRepository.create({
      title,
      value,
      type,
      category: transCategory,
    });
    await transRepository.save(trans);

    return trans;
  }
}

export default CreateTransactionService;
