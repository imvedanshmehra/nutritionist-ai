const welcomeMessage = (userName: string) => {
  return `🥦 Hello ${userName}, Welcome to Nutritionist AI! Your go-to nutrition assistant available 24*7 to help you read and understand food labels and for all your other dietary questions and concerns. Let's work together to achieve your health goals! 🍎
  
How to use me?
💬 Type in ingredients of the food item and lear more about the ingredients used.
📷 Send me a photo of the food product and learn more about it.
🗣️ Ask questions tailored to your specific nutrition goals.

✅ Read and understand food labels easily
✅ Make healthy choices every day
✅ Follow your health goals
✅ Build a healthy lifestyle


‼️ Disclaimer:
While we strive to offer accurate and up-to-date advice, Nutritionist AI is not a substitute for professional medical advice, diagnosis, or treatment. Users are encouraged to consult with qualified healthcare professionals or registered dietitians for personalized dietary recommendations and guidance. By using Nutritionist AI, you acknowledge that any decisions made based on the information provided are at your own risk. Nutritionist AI and its creators shall not be held liable for any consequences arising from the use of the information provided. Always use Nutritionist AI responsibly and in conjunction with professional advice for optimal health outcomes.

💡 
${supportMsg}
`;
};

const subscribeMessage =
  'To continue talking to me, please click on the "Subscribe" button below 👇';

const userPaidMessage =
  "Thank you for subscribing, Nutritionist-AI at your service now ✨";

const errorMsg = "Oops! Something went wrong. Please try again later";

const supportMsg =
  "For any feedback, feature request or issues please feel free to reach out to me 👉 vedanshofficial@gmail.com";

export {
  welcomeMessage,
  subscribeMessage,
  userPaidMessage,
  errorMsg,
  supportMsg,
};
