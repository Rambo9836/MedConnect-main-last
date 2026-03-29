from django.apps import AppConfig


class MedconnectAppConfig(AppConfig):
    name = 'medconnect_app'

    def ready(self):
        import medconnect_app.signals
