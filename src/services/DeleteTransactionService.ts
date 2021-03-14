import { getCustomRepository } from 'typeorm';

import AppError from '../errors/AppError';
import TransactionsRepository from '../repositories/TransactionsRepository';

class DeleteTransactionService {
  public async execute(id: string): Promise<void> {
    const transReposi = getCustomRepository(TransactionsRepository);

    const trans = await transReposi.findOne(id);
    if (!trans) {
      throw new AppError('Transação não encontrada');
    }

    await transReposi.remove(trans);
  }
}

export default DeleteTransactionService;
