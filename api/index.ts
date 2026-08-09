import app from '../server/app';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default function handler(req: any, res: any) {
	// Export a function wrapper so Vercel's Node.js Serverless Functions
	// can invoke the Express app correctly.
	return app(req, res);
}
