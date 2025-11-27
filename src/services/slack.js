const webhookUrl = process.env.SLACK_WEBHOOK_URL;

export async function enviarAlertaSlack(texto) {
  if (!webhookUrl) {
    console.error('SLACK_WEBHOOK_URL não configurada');
    return;
  }

  try {
    const resp = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: texto })
    });

    if (!resp.ok) {
      const erro = await resp.text();
      console.error('Falha ao enviar para Slack:', erro);
    }
  } catch (e) {
    console.error('Erro ao chamar Slack:', e.message);
  }
}
