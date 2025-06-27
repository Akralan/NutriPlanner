import { useState, useRef, useEffect } from 'react';
import { Mic, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';

interface AudioRecorderProps {
  listId: number;
  onRecordingComplete?: () => void;
}

export default function AudioRecorder({ listId, onRecordingComplete }: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Détection automatique des périphériques audio
  useEffect(() => {
    const getDevices = async () => {
      try {
        // Demander la permission d'accéder au micro
        await navigator.mediaDevices.getUserMedia({ audio: true });
        const devices = await navigator.mediaDevices.enumerateDevices();
        const audioInputs = devices.filter(device => device.kind === 'audioinput');
        
        if (audioInputs.length > 0) {
          // Essayer de trouver les AirPods ou un périphérique par défaut
          const airpods = audioInputs.find(d => 
            d.label.toLowerCase().includes('airpod') || 
            d.label.toLowerCase().includes('bluetooth')
          );
          setSelectedDeviceId(airpods?.deviceId || audioInputs[0].deviceId);
          console.log('Périphérique audio sélectionné:', airpods ? 'AirPods' : 'Microphone par défaut');
        }
      } catch (error) {
        console.error('Erreur lors de la détection des périphériques audio:', error);
        toast({
          title: "Erreur",
          description: "Impossible d'accéder au microphone. Vérifiez vos permissions.",
          variant: "destructive",
        });
      }
    };

    getDevices();
  }, [toast]);

  const startRecording = async () => {
    if (!selectedDeviceId) {
      toast({
        title: "Erreur",
        description: "Aucun périphérique audio détecté",
        variant: "destructive",
      });
      return;
    }

    try {
      audioChunks.current = [];
      
      const constraints = {
        audio: {
          deviceId: { exact: selectedDeviceId },
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100,
          channelCount: 1
        }
      };

      console.log('Démarrage de l\'enregistrement avec le périphérique:', selectedDeviceId);
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      
      // Créer un analyseur pour le débogage
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const analyser = audioContext.createAnalyser();
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);
      
      // Vérifier le niveau d'entrée
      const checkLevel = () => {
        const array = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(array);
        const avg = array.reduce((a, b) => a + b) / array.length;
        console.log('Niveau audio moyen:', avg);
        if (isRecording) requestAnimationFrame(checkLevel);
      };
      checkLevel();
      
      // Créer le MediaRecorder
      const recorder = new MediaRecorder(stream);
      mediaRecorder.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          console.log('Données audio reçues:', e.data.size, 'octets');
          audioChunks.current.push(e.data);
        }
      };
      
      recorder.onstop = async () => {
        console.log('Arrêt de l\'enregistrement, traitement des données...');
        const audioBlob = new Blob(audioChunks.current, { type: 'audio/wav' });
        console.log('Taille du blob audio:', audioBlob.size, 'octets');
        
        // Nettoyer
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
        
        if (audioBlob.size > 0) {
          await sendAudioToServer(audioBlob);
        } else {
          toast({
            title: "Erreur",
            description: "Aucun son n'a été enregistré. Vérifiez votre microphone.",
            variant: "destructive",
          });
        }
        
        setIsProcessing(false);
      };

      // Démarrer l'enregistrement
      recorder.start(100); // Collecter des données toutes les 100ms
      setIsRecording(true);
      
      toast({
        title: "Enregistrement en cours",
        description: "Parlez clairement à proximité du microphone...",
      });
      
    } catch (error) {
      console.error('Erreur lors du démarrage de l\'enregistrement:', error);
      toast({
        title: "Erreur",
        description: "Impossible de démarrer l'enregistrement. Vérifiez vos permissions et votre microphone.",
        variant: "destructive",
      });
      setIsProcessing(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder.current && isRecording) {
      mediaRecorder.current.stop();
      setIsRecording(false);
      setIsProcessing(true);
    }
  };

  const sendAudioToServer = async (audioBlob: Blob) => {
    try {
      console.log('Envoi du fichier audio au serveur...');
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.wav');
      formData.append('listId', listId.toString());
      
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/audio-to-meal', {
        method: 'POST',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        body: formData
      });

      if (!response.ok) {
        throw new Error('Erreur serveur');
      }
      
      const data = await response.json();
      console.log('Réponse du serveur:', data);
      
      // Mettre à jour le cache
      queryClient.invalidateQueries({queryKey: ['/api/grocery-lists']});
      queryClient.invalidateQueries({queryKey: [`/api/grocery-lists/${listId}/meals`]});
      
      toast({
        title: "Succès",
        description: data.message || "Votre repas a été ajouté avec succès",
      });
      
      if (onRecordingComplete) {
        onRecordingComplete();
      }
      
    } catch (error) {
      console.error('Erreur lors de l\'envoi de l\'audio:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de l'envoi de l'enregistrement",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={isRecording ? stopRecording : startRecording}
        disabled={isProcessing || !selectedDeviceId}
        className={`rounded-full w-12 h-12 flex items-center justify-center shadow-md transition-colors ${
          isProcessing || !selectedDeviceId
            ? 'bg-gray-300 cursor-not-allowed' 
            : isRecording 
              ? 'bg-red-500 hover:bg-red-600' 
              : 'bg-primary hover:bg-primary/90'
        }`}
        aria-label={isRecording ? "Arrêter l'enregistrement" : "Démarrer l'enregistrement"}
      >
        {isProcessing ? (
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
        ) : isRecording ? (
          <X className="h-6 w-6 text-white" />
        ) : (
          <Mic className="h-6 w-6 text-white" />
        )}
      </button>
      
      {isRecording && (
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ping"></div>
      )}
    </div>
  );
}
