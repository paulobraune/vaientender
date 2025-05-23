const db = require('../utils/db');

async function updateProfile(req, res) {
  try {
    const userId = req.session.user.id;
    const { name, email, fullPhone, currentPassword, newPassword } = req.body;

    if (!name || !email || !fullPhone) {
      return res.status(400).json({ success: false, message: "Nome, email e telefone são obrigatórios." });
    }

    const user = await db.getById('users', userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "Usuário não encontrado." });
    }

    const updateData = { name, email, phone: fullPhone };

    if (newPassword || currentPassword) {
      if (!currentPassword) {
        return res.status(400).json({ success: false, message: "Senha atual é obrigatória para alterar a senha." });
      }
      if (!newPassword) {
        return res.status(400).json({ success: false, message: "Nova senha é obrigatória para alterar." });
      }

      const isMatch = user.password === currentPassword;
      if (!isMatch) {
        return res.status(400).json({ success: false, message: "Senha atual incorreta." });
      }

      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
      if (!passwordRegex.test(newPassword)) {
        return res.status(400).json({ success: false, message: "Nova senha não atende aos requisitos mínimos." });
      }

      updateData.password = newPassword;
    }

    if (email.toLowerCase() !== user.email.toLowerCase()) {
      const existingUsers = await db.find('users', { email });
      const otherUserWithEmail = existingUsers.find(u => u._id !== userId);
      if (otherUserWithEmail) {
        return res.status(400).json({ success: false, message: "Este email já está registrado em outra conta." });
      }
    }

    const updatedUser = await db.update('users', userId, updateData);

    // Update session data with the new user information
    req.session.user = {
      id: updatedUser._id,
      username: updatedUser.email,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role || 'user',
      phone: updatedUser.phone || ''
    };

    req.session.save(err => {
      if (err) {
        console.error("Erro ao salvar sessão após atualização de perfil:", err);
      }
      return res.json({ success: true, message: "Perfil atualizado com sucesso!" });
    });

  } catch (error) {
    console.error("Error updating profile:", error);
    return res.status(500).json({ success: false, message: "Erro interno do servidor ao atualizar perfil." });
  }
}

module.exports = {
  updateProfile
};