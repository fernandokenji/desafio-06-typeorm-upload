import { getCustomRepository } from 'typeorm';
import { Router } from 'express';
import multer from 'multer';

import TransactionsRepository from '../repositories/TransactionsRepository';
import CreateTransactionService from '../services/CreateTransactionService';
import DeleteTransactionService from '../services/DeleteTransactionService';
import ImportTransactionsService from '../services/ImportTransactionsService';
// import DeleteTransactionService from '../services/DeleteTransactionService';
// import ImportTransactionsService from '../services/ImportTransactionsService';

import uploadConfig from '../config/upload';

const upload = multer(uploadConfig);

const transactionsRouter = Router();

transactionsRouter.get('/', async (request, response) => {
  const transRepos = getCustomRepository(TransactionsRepository);

  const transactions = await transRepos.find();
  const balance = await transRepos.getBalance();

  return response.json({ transactions, balance });
});

transactionsRouter.post('/', async (request, response) => {
  const { title, value, type, category } = request.body;

  const createTrans = new CreateTransactionService();

  const trans = await createTrans.execute({
    title,
    value,
    type,
    category,
  });

  return response.json(trans);
});

transactionsRouter.delete('/:id', async (request, response) => {
  const { id } = request.params;

  const deleTrans = new DeleteTransactionService();

  await deleTrans.execute(id);

  return response.status(204).send();
});

transactionsRouter.post(
  '/import',
  upload.single('file'),
  async (request, response) => {
    const importTrans = new ImportTransactionsService();

    const trans = await importTrans.execute(request.file.path);

    return response.json(trans);
  },
);

export default transactionsRouter;
