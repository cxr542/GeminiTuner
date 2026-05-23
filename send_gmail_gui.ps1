Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

$form           = New-Object System.Windows.Forms.Form
$form.Text      = "GeminiTuner Email Panel"
$form.Width     = 480
$form.Height    = 500
$form.StartPosition = "CenterScreen"
$form.BackColor = [Drawing.Color]::FromArgb(11,19,32)

$y = 20
function MakeLabel($text) {
    $l = New-Object System.Windows.Forms.Label
    $l.Text = $text
    $l.ForeColor = [Drawing.Color]::FromArgb(148,163,184)
    $l.Location = [Drawing.Point]::new(30, $script:y)
    $l.Width = 400
    $form.Controls.Add($l)
    $script:y += 22
    return $l
}
function MakeBox($default, $pw) {
    $t = New-Object System.Windows.Forms.TextBox
    $t.Text = $default
    $t.BackColor = [Drawing.Color]::FromArgb(30,41,59)
    $t.ForeColor = [Drawing.Color]::White
    $t.Location = [Drawing.Point]::new(30, $script:y)
    $t.Width = 400
    if ($pw) { $t.PasswordChar = [char]42 }
    $form.Controls.Add($t)
    $script:y += 38
    return $t
}

MakeLabel "Sender Gmail"      | Out-Null
$txtSender   = MakeBox "cxr542@gmail.com"     $false

MakeLabel "App Password"      | Out-Null
$txtAppPw    = MakeBox "ojpl awmu qzhi xxxs"  $true

MakeLabel "Receiver Email"    | Out-Null
$txtReceiver = MakeBox "cxr542@gmail.com"     $false

MakeLabel "Subject"           | Out-Null
$txtSubject  = MakeBox "[GeminiTuner] Work Complete" $false

MakeLabel "Message Body"      | Out-Null
$txtBody = New-Object System.Windows.Forms.TextBox
$txtBody.Multiline = $true
$txtBody.Text = "GeminiTuner UI renewal is complete. Check tuner_ui_demo.html!"
$txtBody.BackColor = [Drawing.Color]::FromArgb(30,41,59)
$txtBody.ForeColor = [Drawing.Color]::White
$txtBody.Location = [Drawing.Point]::new(30, $script:y)
$txtBody.Width  = 400
$txtBody.Height = 70
$txtBody.ScrollBars = "Vertical"
$form.Controls.Add($txtBody)
$script:y += 85

$btn = New-Object System.Windows.Forms.Button
$btn.Text      = "Send Email"
$btn.BackColor = [Drawing.Color]::FromArgb(139,92,246)
$btn.ForeColor = [Drawing.Color]::White
$btn.FlatStyle = "Flat"
$btn.Location  = [Drawing.Point]::new(30, $script:y)
$btn.Width  = 400
$btn.Height = 38
$form.Controls.Add($btn)

$btn.Add_Click({
    try {
        $smtp = New-Object Net.Mail.SmtpClient("smtp.gmail.com", 587)
        $smtp.EnableSsl  = $true
        $smtp.Credentials = New-Object Net.NetworkCredential($txtSender.Text.Trim(), $txtAppPw.Text.Trim())
        $mail = New-Object Net.Mail.MailMessage
        $mail.From = $txtSender.Text.Trim()
        $mail.To.Add($txtReceiver.Text.Trim())
        $mail.Subject = $txtSubject.Text.Trim()
        $mail.Body    = $txtBody.Text.Trim()
        $smtp.Send($mail)
        [Windows.Forms.MessageBox]::Show("Email sent successfully!")
    } catch {
        [Windows.Forms.MessageBox]::Show("Error: " + $_.Exception.Message)
    }
})

[Windows.Forms.Application]::Run($form)
