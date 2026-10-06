import { Router, Request, Response } from 'express';
import { AiService } from '../services/aiService.ts';

const router = Router();

// POST /api/ai/assistant
router.post('/assistant', async (req: Request, res: Response) => {
  try {
    const { query, history } = req.body;

    if (!query || typeof query !== 'string' || !query.trim()) {
      res.status(400).json({
        success: false,
        message: 'Query is required.',
      });
      return;
    }

    const response = await AiService.queryAssistant(query.trim(), Array.isArray(history) ? history : []);

    res.status(200).json({
      success: true,
      ...response,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to process AI assistant request.',
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

export default router;
