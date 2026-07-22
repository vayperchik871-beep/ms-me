import SwiftUI
import AVFoundation
import UniformTypeIdentifiers

struct MusicTrack: Codable, Identifiable {
    let id: String
    let title: String
    let artist: String
    let fileName: String
    var isFavorite: Bool
}

struct MusicView: View {
    @ObservedObject private var theme = ThemeManager.shared
    @State private var tab = "main"
    @State private var tracks: [MusicTrack] = []
    @State private var showPicker = false
    @State private var audioPlayer: AVAudioPlayer?

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                Picker("", selection: $tab) {
                    Text("Главная").tag("main")
                    Text("Избранное").tag("favorites")
                    Text("Загрузки").tag("downloads")
                }
                .pickerStyle(.segmented)
                .padding()

                if tab == "favorites" {
                    listView(filterFavorites)
                } else {
                    listView(filterAll)
                }
            }
            .background(theme.backgroundColor)
            .navigationTitle("Музыка")
            .toolbarBackground(.ultraThinMaterial, for: .navigationBar)
            .toolbarBackground(.visible, for: .navigationBar)
            .toolbar {
                ToolbarItem(placement: .primaryAction) {
                    Button(action: { showPicker = true }) {
                        Image(systemName: "plus")
                    }
                }
            }
            .fileImporter(isPresented: $showPicker, allowedContentTypes: [.mp3, .wav, .audio, .mpeg4Audio]) { result in
                if case .success(let url) = result { importTrack(url) }
            }
        }
    }

    private var filterAll: [MusicTrack] { tracks }
    private var filterFavorites: [MusicTrack] { tracks.filter { $0.isFavorite } }

    private func listView(_ list: [MusicTrack]) -> some View {
        Group {
            if list.isEmpty {
                VStack(spacing: 8) {
                    Image(systemName: "music.note.list").font(.largeTitle).foregroundColor(theme.textSecondary)
                    Text("Нет треков").foregroundColor(theme.textSecondary)
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity)
            } else {
                List(list) { track in
                    Button(action: { playTrack(track) }) {
                        HStack {
                            ZStack {
                                Circle().fill(theme.accent.opacity(0.2)).frame(width: 40, height: 40)
                                Image(systemName: "music.note").foregroundColor(theme.accent)
                            }
                            VStack(alignment: .leading, spacing: 2) {
                                Text(track.title).font(.body).foregroundColor(theme.textPrimary)
                                Text(track.artist).font(.caption).foregroundColor(theme.textSecondary)
                            }
                            Spacer()
                            Button(action: { toggleFavorite(track) }) {
                                Image(systemName: track.isFavorite ? "heart.fill" : "heart")
                                    .foregroundColor(track.isFavorite ? .red : theme.textSecondary)
                            }
                        }
                    }
                }
                .listStyle(.plain)
                .scrollContentBackground(.hidden)
            }
        }
    }

    private func importTrack(_ url: URL) {
        guard url.startAccessingSecurityScopedResource() else { return }
        defer { url.stopAccessingSecurityScopedResource() }
        do {
            let data = try Data(contentsOf: url)
            let fileName = url.lastPathComponent
            let docs = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask).first!
            let dest = docs.appendingPathComponent(fileName)
            try data.write(to: dest)
            let track = MusicTrack(
                id: UUID().uuidString,
                title: url.deletingPathExtension().lastPathComponent,
                artist: "Неизвестный",
                fileName: fileName,
                isFavorite: false
            )
            tracks.append(track)
            saveTracks()
        } catch { print(error) }
    }

    private func playTrack(_ track: MusicTrack) {
        let docs = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask).first!
        let url = docs.appendingPathComponent(track.fileName)
        guard FileManager.default.fileExists(atPath: url.path) else { return }
        audioPlayer = try? AVAudioPlayer(contentsOf: url)
        audioPlayer?.play()
    }

    private func toggleFavorite(_ track: MusicTrack) {
        if let i = tracks.firstIndex(where: { $0.id == track.id }) {
            tracks[i].isFavorite.toggle()
            saveTracks()
        }
    }

    private func saveTracks() {
        if let data = try? JSONEncoder().encode(tracks) {
            UserDefaults.standard.set(data, forKey: "music_tracks")
        }
    }

    private func loadTracks() {
        if let data = UserDefaults.standard.data(forKey: "music_tracks"),
           let saved = try? JSONDecoder().decode([MusicTrack].self, from: data) {
            tracks = saved
        }
    }
}
