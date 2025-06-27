import { useState, useEffect } from 'react';
import { Mic, Check, Headphones } from 'lucide-react';
import { useToast } from '../hooks/use-toast';

interface MicrophoneSelectorProps {
  className?: string;
}

export default function MicrophoneSelector({ className = '' }: MicrophoneSelectorProps) {
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const getDevices = async () => {
      try {
        // Demander la permission d'accéder au micro
        await navigator.mediaDevices.getUserMedia({ audio: true });
        const devices = await navigator.mediaDevices.enumerateDevices();
        const audioInputs = devices.filter(device => device.kind === 'audioinput');
        
        if (audioInputs.length > 0) {
          setDevices(audioInputs);
          
          // Récupérer le périphérique précédemment sélectionné ou prendre le premier
          const savedDeviceId = localStorage.getItem('selectedMicrophoneId');
          const defaultDevice = audioInputs.find(d => d.deviceId === savedDeviceId) || audioInputs[0];
          
          if (defaultDevice) {
            setSelectedDeviceId(defaultDevice.deviceId);
            // Sauvegarder dans le localStorage
            localStorage.setItem('selectedMicrophoneId', defaultDevice.deviceId);
          }
        }
      } catch (error) {
        console.error('Erreur lors de la détection des micros:', error);
        toast({
          title: "Erreur",
          description: "Impossible d'accéder aux micros. Vérifiez vos permissions.",
          variant: "destructive",
        });
      }
    };

    getDevices();

    // Écouter les changements de périphériques
    const handleDeviceChange = () => getDevices();
    navigator.mediaDevices.addEventListener('devicechange', handleDeviceChange);
    
    return () => {
      navigator.mediaDevices.removeEventListener('devicechange', handleDeviceChange);
    };
  }, [toast]);

  const handleSelectDevice = (deviceId: string) => {
    setSelectedDeviceId(deviceId);
    localStorage.setItem('selectedMicrophoneId', deviceId);
    setIsOpen(false);
    
    toast({
      title: "Microphone sélectionné",
      description: "Le micro a été changé avec succès.",
    });
  };

  const getDeviceName = (device: MediaDeviceInfo) => {
    if (!device.label) return `Périphérique ${device.deviceId.substring(0, 5)}`;
    
    // Noms plus lisibles pour les appareils courants
    return device.label
      .replace('Microphone (', '')
      .replace(')', '')
      .replace('Microphone Array', 'Micro intégré')
      .replace('Microphone (Realtek(R) Audio)', 'Micro intégré')
      .replace('Headset Microphone', 'Casque micro')
      .replace('AirPods', 'AirPods 🎧');
  };

  const selectedDevice = devices.find(d => d.deviceId === selectedDeviceId);

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between p-3 rounded-xl bg-white/90 hover:bg-white transition-colors border border-gray-200 shadow-sm`}
      >
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-full bg-primary/10 text-primary">
            <Mic className="h-5 w-5" />
          </div>
          <div className="text-left">
            <p className="text-sm font-medium text-gray-800">Microphone</p>
            <p className="text-xs text-gray-600">
              {selectedDevice ? getDeviceName(selectedDevice) : 'Non sélectionné'}
            </p>
          </div>
        </div>
        <svg
          className={`w-5 h-5 text-gray-500 transition-transform ${isOpen ? 'transform rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute z-[100] w-full mt-2 rounded-xl overflow-hidden bg-white border border-gray-200 shadow-lg">
          <div className="max-h-60 overflow-y-auto">
            {devices.length === 0 ? (
              <div className="p-3 text-sm text-gray-500 text-center">
                Aucun micro détecté
              </div>
            ) : (
              devices.map((device) => (
                <button
                  key={device.deviceId}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelectDevice(device.deviceId);
                  }}
                  className={`w-full flex items-center justify-between p-3 text-left hover:bg-gray-50 transition-colors ${
                    selectedDeviceId === device.deviceId ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-1 rounded-full">
                      {device.label.toLowerCase().includes('airpod') ? (
                        <Headphones className="h-4 w-4 text-gray-600" />
                      ) : (
                        <Mic className="h-4 w-4 text-gray-600" />
                      )}
                    </div>
                    <span className="text-sm text-gray-800">
                      {getDeviceName(device)}
                    </span>
                  </div>
                  {selectedDeviceId === device.deviceId && (
                    <Check className="h-4 w-4 text-primary" />
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
