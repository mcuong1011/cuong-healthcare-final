from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import InsuranceClaim
from .serializers import InsuranceClaimSerializer
from .permissions import IsInsuranceAgent

class CreateClaimView(APIView):
    def post(self, request):
        serializer = InsuranceClaimSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=201)
        return Response(serializer.errors, status=400)

class ListClaimView(APIView):
    def get(self, request):
        claims = InsuranceClaim.objects.all()
        return Response(InsuranceClaimSerializer(claims, many=True).data)

class UpdateClaimStatusView(APIView):
    permission_classes = [IsAuthenticated, IsInsuranceAgent]
    def put(self, request, pk):
        try:
            claim = InsuranceClaim.objects.get(id=pk)
        except InsuranceClaim.DoesNotExist:
            return Response({'error': 'Claim not found'}, status=404)

        status_value = request.data.get('status')
        if status_value in ['APPROVED', 'REJECTED']:
            claim.status = status_value
            claim.save()
            return Response({'message': f'Claim {status_value.lower()} successfully'})
        return Response({'error': 'Invalid status'}, status=400)
