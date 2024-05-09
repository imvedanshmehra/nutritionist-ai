import { Router } from "express";
import bodyParser from "body-parser";
import { getSubscriptionEvent } from "../../controllers/subscription-controller";

const router = Router();

// Saves a valid raw JSON body to req.rawBody
// Credits to https://stackoverflow.com/a/35651853/90674
router.use(
  bodyParser.json({
    verify: (req: any, _, buf, encoding: any) => {
      if (buf && buf.length) {
        req.rawBody = buf.toString(encoding || "utf8");
      }
    },
  })
);

// Parse application/json
router.use(bodyParser.json());

router.post("/", getSubscriptionEvent);

export { router as billingRouter };
