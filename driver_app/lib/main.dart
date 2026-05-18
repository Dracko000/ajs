import 'package:flutter/material.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import 'dart:async';

void main() {
  runApp(const DriverApp());
}

class DriverApp extends StatelessWidget {
  const DriverApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'AJS Driver',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        primaryColor: const Color(0xFFE31E24), // Merah Dasar AJS
        colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFFE31E24), primary: const Color(0xFFE31E24)),
        fontFamily: 'Inter',
        scaffoldBackgroundColor: Colors.white,
      ),
      home: const DriverHomeScreen(),
    );
  }
}

class DriverHomeScreen extends StatefulWidget {
  const DriverHomeScreen({super.key});

  @override
  State<DriverHomeScreen> createState() => _DriverHomeScreenState();
}

class _DriverHomeScreenState extends State<DriverHomeScreen> {
  bool _isOnline = false;
  final Completer<GoogleMapController> _controller = Completer<GoogleMapController>();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Stack(
        children: [
          // Map
          GoogleMap(
            initialCameraPosition: const CameraPosition(
              target: LatLng(-6.200000, 106.816666),
              zoom: 15,
            ),
            onMapCreated: (controller) => _controller.complete(controller),
            myLocationEnabled: true,
            zoomControlsEnabled: false,
          ),

          // Overlay Atas: Kartu Status
          Positioned(
            top: 60,
            left: 20,
            right: 20,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 15),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(15),
                boxShadow: const [BoxShadow(color: Colors.black12, blurRadius: 10)],
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('Status Driver AJS', style: TextStyle(color: Colors.grey)),
                      Text(
                        _isOnline ? 'Aktif (Online)' : 'Tidak Aktif (Offline)',
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                          color: _isOnline ? const Color(0xFFE31E24) : Colors.grey,
                        ),
                      ),
                    ],
                  ),
                  Switch(
                    value: _isOnline,
                    onChanged: (value) {
                      setState(() => _isOnline = value);
                    },
                    activeColor: const Color(0xFFE31E24),
                  ),
                ],
              ),
            ),
          ),

          // Overlay Bawah: Statistik
          if (_isOnline)
            Positioned(
              bottom: 40,
              left: 20,
              right: 20,
              child: Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: const Color(0xFF1C1C1C),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceAround,
                  children: [
                    _buildStat('Performa', '100%'),
                    _buildStat('Pendapatan', 'Rp 0'),
                    _buildStat('Target', '0/15'),
                  ],
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildStat(String label, String value) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Text(label, style: const TextStyle(color: Colors.grey, fontSize: 12)),
        const SizedBox(height: 5),
        Text(
          value,
          style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16),
        ),
      ],
    );
  }
}
