import { useMemo, useRef, useState } from 'react';
import {
  Modal, Pressable, ScrollView, StyleSheet, TextInput,
  TouchableOpacity, View, useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';
import { ThemedText } from '@/components/ui/ThemedText';

export interface DropdownOption {
  label: string;
  value: string;
}

interface ThemedDropdownProps {
  label?: string;
  value: string;
  options: DropdownOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  stackOrder?: number;
  searchable?: boolean;
  searchPlaceholder?: string;
}

export function ThemedDropdown({
  label,
  value,
  options,
  onChange,
  placeholder,
  stackOrder = 20,
  searchable = false,
  searchPlaceholder = '🔍',
}: ThemedDropdownProps) {
  const { colors } = useTheme();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const triggerRef = useRef<View>(null);
  const searchRef = useRef<TextInput>(null);
  const [menuFrame, setMenuFrame] = useState({ x: 16, y: 100, width: 240, maxHeight: 260 });

  const selectedLabel = useMemo(
    () => options.find((o) => o.value === value)?.label ?? placeholder ?? '',
    [options, placeholder, value]
  );

  const filteredOptions = useMemo(() => {
    if (!searchable || !searchQuery.trim()) return options;
    const q = searchQuery.toLowerCase();
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [options, searchQuery, searchable]);

  function openDropdown() {
    triggerRef.current?.measureInWindow((x, y, measuredWidth, measuredHeight) => {
      const safeWidth = Math.min(Math.max(measuredWidth, 180), windowWidth - 32);
      const left = Math.max(16, Math.min(x, windowWidth - safeWidth - 16));

      const spaceBelow = windowHeight - (y + measuredHeight) - 16;
      const spaceAbove = y - 16;
      const estimatedHeight = Math.min(340, (searchable ? 48 : 0) + options.length * 44 + 16);

      let top: number;
      let maxHeight: number;

      if (spaceBelow >= estimatedHeight || spaceBelow >= spaceAbove) {
        // Open downward
        top = y + measuredHeight + 6;
        maxHeight = Math.min(340, Math.max(120, spaceBelow));
      } else {
        // Open upward
        maxHeight = Math.min(340, Math.max(120, spaceAbove));
        const positionHeight = Math.min(estimatedHeight, maxHeight);
        top = y - positionHeight - 6;
      }

      setMenuFrame({ x: left, y: top, width: safeWidth, maxHeight });
      setIsOpen(true);
      if (searchable) {
        setTimeout(() => searchRef.current?.focus(), 80);
      }
    });
  }

  function closeDropdown() {
    setIsOpen(false);
    setSearchQuery('');
  }

  return (
    <View style={[styles.container, { zIndex: isOpen ? stackOrder : 1, elevation: isOpen ? stackOrder : 1 }]}>
      {label ? <ThemedText style={styles.label}>{label}</ThemedText> : null}

      <TouchableOpacity
        ref={triggerRef}
        style={[styles.trigger, { borderColor: colors.border, backgroundColor: colors.inputBackground }]}
        activeOpacity={0.85}
        onPress={() => isOpen ? closeDropdown() : openDropdown()}
      >
        <ThemedText style={styles.triggerText}>{selectedLabel}</ThemedText>
        <Ionicons name={isOpen ? 'chevron-up' : 'chevron-down'} size={16} color={colors.textSecondary} />
      </TouchableOpacity>

      <Modal
        visible={isOpen}
        transparent
        animationType="fade"
        supportedOrientations={['portrait', 'landscape', 'landscape-left', 'landscape-right']}
        onRequestClose={closeDropdown}
      >
        <Pressable style={styles.modalBackdrop} onPress={closeDropdown}>
          <View
            style={[
              styles.options,
              {
                top: menuFrame.y,
                left: menuFrame.x,
                width: menuFrame.width,
                borderColor: colors.border,
                backgroundColor: colors.card,
                zIndex: stackOrder + 1,
                elevation: stackOrder + 1,
              },
            ]}
          >
            {searchable && (
              <Pressable
                style={[styles.searchRow, { borderBottomColor: colors.border, backgroundColor: colors.inputBackground }]}
                onPress={(e) => e.stopPropagation()}
              >
                <Ionicons name="search" size={15} color={colors.textSecondary} />
                <TextInput
                  ref={searchRef}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder={searchPlaceholder}
                  placeholderTextColor={colors.textTertiary}
                  style={[styles.searchInput, { color: colors.text }]}
                  returnKeyType="search"
                  clearButtonMode="while-editing"
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={8}>
                    <Ionicons name="close-circle" size={15} color={colors.textSecondary} />
                  </TouchableOpacity>
                )}
              </Pressable>
            )}

            <ScrollView
              style={[styles.optionsScroll, { maxHeight: menuFrame.maxHeight - (searchable ? 48 : 0) }]}
              nestedScrollEnabled
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator
            >
              {filteredOptions.length === 0 ? (
                <View style={styles.noResults}>
                  <ThemedText variant="caption" tone="tertiary">Sin resultados</ThemedText>
                </View>
              ) : (
                filteredOptions.map((option) => {
                  const selected = value === option.value;
                  return (
                    <TouchableOpacity
                      key={option.value}
                      style={[styles.option, selected && { backgroundColor: colors.primaryMuted }]}
                      activeOpacity={0.8}
                      onPress={() => {
                        onChange(option.value);
                        closeDropdown();
                      }}
                    >
                      <ThemedText style={[styles.optionText, selected && { color: colors.primary }]}>
                        {option.label}
                      </ThemedText>
                    </TouchableOpacity>
                  );
                })
              )}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
    position: 'relative',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
  },
  modalBackdrop: {
    flex: 1,
  },
  trigger: {
    minHeight: 48,
    borderRadius: 10,
    borderWidth: 1.5,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  triggerText: {
    fontSize: 15,
    flex: 1,
  },
  options: {
    position: 'absolute',
    borderWidth: 1.5,
    borderRadius: 10,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    height: 44,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    padding: 0,
  },
  optionsScroll: {},
  option: {
    minHeight: 44,
    paddingHorizontal: 14,
    justifyContent: 'center',
  },
  optionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  noResults: {
    padding: 16,
    alignItems: 'center',
  },
});
