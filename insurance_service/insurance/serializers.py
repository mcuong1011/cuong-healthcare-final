from rest_framework import serializers
from .models import InsuranceClaim

class InsuranceClaimSerializer(serializers.ModelSerializer):
    class Meta:
        model = InsuranceClaim
        fields = '__all__'
