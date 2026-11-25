import axios from "axios";

export const explainIssue = async (req, res) => {
  try {
    const { code, issue } = req.body;

    if (!code || typeof code !== "string" || !code.trim()) {
      return res.status(400).json({
        success: false,
        message: "Source code is required",
      });
    }

    if (code.length > 50000) {
      return res.status(400).json({
        success: false,
        message: "Code exceeds the 50000 character limit",
      });
    }

    if (
  !issue ||
  typeof issue !== "object" ||
  Array.isArray(issue) ||
  Object.keys(issue).length === 0
) {
  return res.status(400).json({
    success: false,
    message: "A valid issue is required",
  });
}
    if (!process.env.AI_SERVICE_URL) {
  return res.status(500).json({
    success: false,
    message: "AI service URL is not configured",
  });
}
    const response = await axios.post(
      `${process.env.AI_SERVICE_URL}/explain`,
      { code, issue },
      { timeout: 360000 }
    );

    return res.status(200).json(response.data);

  } catch (error) {
    console.error(
      "AI explanation error:",
      error.response?.data || error.message
    );

    return res.status(502).json({
      success: false,
      message: "AI explanation service is currently unavailable",
    });
  }
};