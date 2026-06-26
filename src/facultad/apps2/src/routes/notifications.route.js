const { Router } = require ('express');

function NotificationsRouter (notificationsController) {
    const router = Router();

    router.get('/',
        (req,res,next) => notificationsController.getNotifications(req,res,next)
    );

    router.get('/:uuid',
        (req,res,next) => notificationsController.getNotificationById(req,res,next)
    );

    return router;
}

module.exports = { NotificationsRouter };