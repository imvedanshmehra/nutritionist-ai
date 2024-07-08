const WELCOME_MESSAGE = (userName: string) => {
  return `Hello ${userName} 👋 Welcome to Nutritionist AI 🥦 Your go-to nutrition assistant available 24*7 for all your dietary questions and concerns. Let's work together to achieve your health goals! 💪
  
Using me is very easy:
💬 Type in ingredients of the food item.
📷 Send me a photo of the food product.
🗣️ Ask questions tailored to your specific nutrition goals.

✅ Understand food labels easily
✅ Make healthy choices every day
✅ Follow your health goals
✅ Build a healthy lifestyle


‼️ Disclaimer:
While we strive to offer accurate and up-to-date advice, Nutritionist AI is not a substitute for professional medical advice, diagnosis, or treatment. Users are encouraged to consult with qualified healthcare professionals or registered dietitians for personalized dietary recommendations and guidance. By using Nutritionist AI, you acknowledge that any decisions made based on the information provided are at your own risk. Nutritionist AI and its creators shall not be held liable for any consequences arising from the use of the information provided. Always use Nutritionist AI responsibly and in conjunction with professional advice for optimal health outcomes.

💡 
${SUPPORT_MESSAGE}
`;
};

const SUBSCRIBE_MESSAGE =
  'To continue talking to me, please click on the "Subscribe" button below 👇';

const PAYMENT_SUCCESSFUL_MESSAGE =
  "Thank you for subscribing, Nutritionist-AI at your service now ✨";

const ERROR_MESSAGE = "Oops! Something went wrong. Please try again later";

const SUPPORT_MESSAGE =
  "For any feedback, feature request or issues 👉 https://insigh.to/b/nutritionist-ai";

export {
  WELCOME_MESSAGE,
  SUBSCRIBE_MESSAGE,
  PAYMENT_SUCCESSFUL_MESSAGE,
  ERROR_MESSAGE,
  SUPPORT_MESSAGE,
};
