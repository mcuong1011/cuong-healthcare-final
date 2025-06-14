from django.urls import path
from .views import *

urlpatterns = [
    path('tests/', LabTestListView.as_view()),
    path('orders/create/', LabOrderCreateView.as_view()),
    path('orders/', LabOrderListView.as_view()),
    path('results/', LabResultListView.as_view()),
    path('results/create/', LabResultCreateView.as_view()),
]
