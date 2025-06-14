from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .serializers import SymptomsSerializer
from .robot import predict

class DiagnoseView(APIView):
    """
    POST /api/vr/diagnose/
    body: fever, cough, sneezing, fatigue, loss_of_taste, itchy_eyes (bool)
    """
    def post(self, request):
        ser = SymptomsSerializer(data=request.data)
        if not ser.is_valid():
            return Response(ser.errors, status=status.HTTP_400_BAD_REQUEST)

        # build list 0/1
        fields = ['fever','cough','sneezing','fatigue','loss_of_taste','itchy_eyes']
        symptoms = [1 if ser.validated_data[f] else 0 for f in fields]

        result = predict(symptoms)
        return Response(result, status=status.HTTP_200_OK)
