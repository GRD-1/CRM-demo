/*-----------------------------------------------------------------------------------------------*/
/*     модуль отправки электронных сообщений                                                     */
/*-----------------------------------------------------------------------------------------------*/
const IMAP = require('node-imap')
const mimemessage = require('mimemessage')
const { v4: uuidv4 } = require('uuid');
const { mail: mail } = require('../config/access')

// Функция создания mimetype объекта из тела файла и его типа
function new_mime( contentType, file_content ) {
    try {
        return mimemessage.factory({
            contentType: contentType,
            contentTransferEncoding: 'base64',
            body: file_content
        })
    }catch (err) {
        if(!err.code || !String(err.code).match('SRV')) {
            err = new SRVError('SRV0000', _stackTrace(), `Ошибка в функции new_mime(). Причина: ${err.message}`)
        }
        throw err;
    }
}

// Получение ContentFile по расширению (среди зарегистрированных типов расширений)
function get_content_type(extname) {
    try{
        switch (extname.toLowerCase()) {
            case '.png':
            case '.jpg':
            case '.jpeg':
            case '.gif':
                return 'image/png';
            case '.pdf':
                return 'application/pdf';
            case '.txt':
                return 'text/*';
            case '.doc':
            case '.dot':
                return 'application/msword';
            case '.docx':
                return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
            case '.dotx':
                return 'application/vnd.openxmlformats-officedocument.wordprocessingml.template';
            case '.docm':
                return 'application/vnd.ms-word.document.macroEnabled.12';
            case '.dotm':
                return 'application/vnd.ms-word.template.macroEnabled.12';
            case '.xls':
            case '.xlt':
            case '.xla':
                return 'application/vnd.ms-excel';
            case '.xlsx':
                return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
            case '.xltx':
                return 'application/vnd.openxmlformats-officedocument.spreadsheetml.template';
            case '.xlsm':
                return 'application/vnd.ms-excel.sheet.macroEnabled.12';
            case '.xltm':
                return 'application/vnd.ms-excel.template.macroEnabled.12';
            case '.xlam':
                return 'application/vnd.ms-excel.addin.macroEnabled.12';
            case '.xlsb':
                return 'application/vnd.ms-excel.sheet.binary.macroEnabled.12';
            case '.ppt':
            case '.pot':
            case '.pps':
            case '.ppa':
                return 'application/vnd.ms-powerpoint';
            case '.pptx':
                return 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
            default:
                return'application/octet-stream'
        }
    }catch (err) {
        if(!err.code || !String(err.code).match('SRV')) {
            err = new SRVError('SRV0000', _stackTrace(), `Ошибка в функции get_content_type(). Причина: ${err.message}`)
        }
        throw err;
    }
}

// Сохранение сообщения в "Отправленные" через IMAP
function save_to_send(to, subject, html, attachments) {
    try {
        let imap = new IMAP({
            user: mail.user,
            password: mail.pass,
            host: mail.imap_host,
            port: mail.imap_port,
            tls: true,
            // [TASK] Это далеко не самая безопасная настройка. В идеале надо получить сертификат и пропускать соединение через него
            tlsOptions: { rejectUnauthorized: false }
        });

        imap.once('ready', function () {
            imap.openBox('Sent', false, async (err, box) => {
                if (err) throw err;

                let msg = mimemessage.factory({
                    contentType: 'multipart/mixed',
                    body: []
                });

                const path = require('path');
                let entity;

                msg.header('Message-ID', uuidv4() + '<s@remelle.ru>');
                msg.header('From', '"TWINE_HOME" <s@remelle.ru>');
                msg.header('To', to);
                msg.header('Subject', subject);
                msg.header('Date', new Date());

                // Обходим массив вложений
                attachments.forEach((attachment) => {
                    let extname = path.extname(attachment.filename); // получим расширение файла

                    entity = new_mime(get_content_type(extname), attachment.content ); // Создание вложений типа MIMETYPE
                    entity.header('Content-Disposition', 'attachment ;filename="'+attachment.filename+'"');
                    msg.body.push(entity) // Записываем вложение в письмо
                });

                // Создание HTML MIME содержимого
                let htmlEntity = mimemessage.factory({
                    contentType: 'text/html;charset=utf-8',
                    body: html
                });
                if (html) msg.body.push(htmlEntity);

                imap.append(msg.toString());
                imap.end();
            })
        });

        imap.once('error', function (err) {
            imap.destroy();
            throw err
        });

        imap.once('end', function (res) {
            imap.destroy();
            return res
        });

        imap.connect();
    }catch (err) {
        if(!err.code || !String(err.code).match('SRV')) {
            err = new SRVError('SRV0000', _stackTrace(), `Ошибка при попытке подключиться к почте по IMAP. Причина: ${err.message}`)
        }
        throw err;
    }
}

/*  Функция отправки сообщения по SMTP

    to - email получателя
    subject - заголовок письма
    to_sent - нужно ли сохранить копию в "Отправленные (по умолчанию true)
    html - текст или HTML разметка тела письма
    attachments - массив вложений
        [{
            filename: 'picture.jpg', // Имя файла при отправке
            content : fs.readFileSync('../uploads/img_to_send.jpg', {encoding: 'base64'}), // Полный путь до файла на сервере
            encoding: 'base64' // кодировка файла (не изменять)
        },
        {
            filename: 'some PDF document.pdf',
            content : fs.readFileSync('../uploads/aud.pdf', {encoding: 'base64'}),
            encoding: 'base64'
        }]

*/
exports.send = async function (to, subject, to_sent = true, html = '', attachments = []) {
    try{
        const nodemailer = require('nodemailer')
        let transporter = await nodemailer.createTransport({
            host: mail.smtp_host,
            port: mail.smtp_port,
            secure: true,
            auth: {
                user: mail.user,
                pass: mail.pass
            }
        });

        let mail_res = await transporter.sendMail({
            from: mail.from,
            to: to,
            subject: subject,
            html: html,
            attachments: attachments
        });

        if (!mail_res) throw err;

        // Сохраним копию отправленного сообщения в "Отправленные", если нужно
        if (to_sent) save_to_send(to, subject, html, attachments)

        return mail_res
    }catch (err) {
        if(!err.code || !String(err.code).match('SRV')) {
            err = new SRVError('SRV0000', _stackTrace(), `ошибка при попытке отправить email. Причина: ${err.message}`)
        }
        throw err;
    }
}


