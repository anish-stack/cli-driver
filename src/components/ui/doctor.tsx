import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Image,
    TouchableOpacity,
    Dimensions,
    StatusBar,
    Linking,
    Alert,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useSettings } from '../../hooks/use-settings';

const { width } = Dimensions.get('window');
const DoctorIntroPage = ({ navigation }) => {
    const { settings } = useSettings()
    const achievements = [
        { number: '50,000+', label: 'Patients Treated', icon: 'people' },
        { number: '15+', label: 'Years Experience', icon: 'work' },
        { number: '98%', label: 'Success Rate', icon: 'trending-up' },
        { number: '24/7', label: 'Support Available', icon: 'support-agent' },
    ];

    const specialties = [
        {
            title: 'Sports Physiotherapy',
            subtitle: 'Personalized Treatments',
            icon: 'sports-soccer',
            color: '#3B82F6',
            bgColor: '#EFF6FF',
        },
        {
            title: 'Orthopedic Physiotherapy',
            subtitle: 'Personalized Treatments',
            icon: 'healing',
            color: '#10B981',
            bgColor: '#F0FDF4',
        },
        {
            title: 'Rheumatological Physiotherapy',
            subtitle: 'Personalized Treatments',
            icon: 'accessibility',
            color: '#F59E0B',
            bgColor: '#FFFBEB',
        },
        {
            title: 'Traumatological Physiotherapy',
            subtitle: 'Personalized Treatments',
            icon: 'local-hospital',
            color: '#EF4444',
            bgColor: '#FEF2F2',
        },
    ];

    const highlights = [
        {
            title: 'Empathetic Approach',
            description: 'Calm, respectful manner that makes patients feel at ease during recovery',
            icon: 'favorite',
            color: '#F59E0B',
        },
        {
            title: 'Latest Technology',
            description: 'Cutting-edge equipment combined with proven manual therapy techniques',
            icon: 'settings',
            color: '#3B82F6',
        },
        {
            title: 'Customized Treatment',
            description: 'Personalized care plans designed to meet each patient\'s unique needs',
            icon: 'person-pin',
            color: '#10B981',
        },
        {
            title: 'Comprehensive Care',
            description: 'One-stop destination for all spine and musculoskeletal health needs',
            icon: 'medical-services',
            color: '#8B5CF6',
        },
    ];

    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            <StatusBar barStyle="light-content" backgroundColor="#6366F1" />
            <LinearGradient colors={["#f8fafc", "#dbeafe", "#e0e7ff"]} style={styles.backgroundGradient}>





                {/* Specialties Section */}
                <View style={styles.section}>

                    <View style={styles.specialtiesContainer}>
                        {specialties.map((specialty, index) => (
                            <TouchableOpacity key={index} style={styles.specialtyCard}>
                                <View style={[styles.specialtyIcon, { backgroundColor: specialty.bgColor }]}>
                                    <Icon name={specialty.icon} size={moderateScale(24)} color={specialty.color} />
                                </View>
                                <View style={styles.specialtyContent}>
                                    <Text style={styles.specialtyTitle}>{specialty.title}</Text>
                                    <Text style={styles.specialtySubtitle}>{specialty.subtitle}</Text>
                                </View>
                                <Icon name="keyboard-arrow-down" size={moderateScale(20)} color="#9CA3AF" />
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Highlights Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>What Sets Him Apart</Text>
                    <View style={styles.highlightsContainer}>
                        {highlights.map((highlight, index) => (
                            <View key={index} style={styles.highlightCard}>
                                <View style={[styles.highlightIcon, { backgroundColor: `${highlight.color}15` }]}>
                                    <Icon name={highlight.icon} size={moderateScale(24)} color={highlight.color} />
                                </View>
                                <View style={styles.highlightContent}>
                                    <Text style={styles.highlightTitle}>{highlight.title}</Text>
                                    <Text style={styles.highlightDescription}>{highlight.description}</Text>
                                </View>
                            </View>
                        ))}
                    </View>
                </View>

                {/* Achievements Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Our Achievements</Text>
                    <Text style={styles.sectionSubtitle}>Numbers that speak for our commitment to excellence</Text>
                    <View style={styles.achievementsContainer}>
                        {achievements.map((achievement, index) => (
                            <View key={index} style={styles.achievementCard}>
                                <View style={styles.achievementIcon}>
                                    <Icon name={achievement.icon} size={moderateScale(28)} color="#6366F1" />
                                </View>
                                <Text style={styles.achievementNumber}>{achievement.number}</Text>
                                <Text style={styles.achievementLabel}>{achievement.label}</Text>
                            </View>
                        ))}
                    </View>
                </View>

                {/* CTA Section */}
                <View style={styles.ctaSection}>
                    <View style={styles.ctaCard}>
                        <Text style={styles.ctaTitle}>Ready to Start Your Healing Journey?</Text>
                        <Text style={styles.ctaDescription}>
                            Experience the difference that personalized, compassionate care can make. Join thousands of satisfied patients who have trusted us with their health and recovery.
                        </Text>

                        <View style={styles.ctaButtons}>
                            <TouchableOpacity onPress={() => navigation.navigate('booking-now')} style={styles.primaryButton}>
                                <Icon name="event" size={moderateScale(20)} color="#FFFFFF" />
                                <Text style={styles.primaryButtonText}>Schedule Consultation</Text>
                            </TouchableOpacity>

                            <TouchableOpacity onPress={() => {
                                Linking.openURL(`tel:${settings?.contact_details?.phone_number}`).catch((err) =>
                                    Alert.alert("Error", "Unable to make a call")
                                );
                            }} style={styles.secondaryButton}>
                                <Icon name="phone" size={moderateScale(20)} color="#6366F1" />
                                <Text style={styles.secondaryButtonText}>Call Now</Text>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.ctaFeatures}>
                            <View style={styles.ctaFeature}>
                                <Icon name="location-on" size={moderateScale(16)} color="#6B7280" />
                                <Text style={styles.ctaFeatureText}>Delhi & Mumbai</Text>
                            </View>
                            <View style={styles.ctaFeature}>
                                <Icon name="support-agent" size={moderateScale(16)} color="#6B7280" />
                                <Text style={styles.ctaFeatureText}>24/7 Support</Text>
                            </View>

                        </View>
                    </View>
                </View>
            </LinearGradient>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f8fafc",

    },
    header: {

        paddingTop: verticalScale(20),
        paddingBottom: verticalScale(30),

    },
    backgroundGradient: {
        flex: 1,
        minHeight: 120,
    },
    headerContent: {
        flexDirection: 'row',
        paddingHorizontal: scale(20),
        alignItems: 'center',
    },
    doctorImageContainer: {
        position: 'relative',
        marginRight: scale(15),
    },
    doctorImage: {
        width: scale(80),
        height: scale(80),
        borderRadius: scale(40),
        borderWidth: 3,
        borderColor: '#FFFFFF',
    },
    verificationBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: '#FFFFFF',
        borderRadius: scale(12),
        padding: scale(4),
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    doctorInfo: {
        flex: 1,
    },
    doctorName: {
        fontSize: moderateScale(20),
        fontWeight: '700',
        color: '#000',
        marginBottom: verticalScale(4),
    },
    doctorTitle: {
        fontSize: moderateScale(14),
        color: '#000',
        marginBottom: verticalScale(2),
    },
    clinicName: {
        fontSize: moderateScale(12),
        color: '#000',
        marginBottom: verticalScale(8),
    },
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: verticalScale(4),
    },
    ratingText: {
        fontSize: moderateScale(14),
        fontWeight: '600',
        color: '#000',
        marginLeft: scale(4),
        marginRight: scale(8),
    },
    ratingSubtext: {
        fontSize: moderateScale(12),
        color: '#000',
    },
    locationContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    locationText: {
        fontSize: moderateScale(12),
        color: '#000',
        marginLeft: scale(4),
    },
    section: {
        paddingHorizontal: scale(20),
        marginBottom: verticalScale(24),
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: verticalScale(12),
    },
    sectionTitle: {
        fontSize: moderateScale(18),
        fontWeight: '600',
        color: '#1F2937',
        marginLeft: scale(8),
    },
    sectionSubtitle: {
        fontSize: moderateScale(14),
        color: '#6B7280',
        marginBottom: verticalScale(16),
    },
    availabilityCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        padding: scale(16),
        borderRadius: scale(12),
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    availabilityText: {
        fontSize: moderateScale(14),
        color: '#374151',
        marginLeft: scale(12),
        fontWeight: '500',
    },
    aboutCard: {
        backgroundColor: '#FFFFFF',
        padding: scale(20),
        borderRadius: scale(16),
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    aboutText: {
        fontSize: moderateScale(14),
        color: '#4B5563',
        lineHeight: moderateScale(20),
        marginBottom: verticalScale(12),
    },
    specialtiesContainer: {
        marginTop: 20,
        gap: verticalScale(12),
    },
    specialtyCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        padding: scale(16),
        borderRadius: scale(12),
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    specialtyIcon: {
        width: scale(48),
        height: scale(48),
        borderRadius: scale(24),
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: scale(12),
    },
    specialtyContent: {
        flex: 1,
    },
    specialtyTitle: {
        fontSize: moderateScale(16),
        fontWeight: '600',
        color: '#1F2937',
        marginBottom: verticalScale(2),
    },
    specialtySubtitle: {
        fontSize: moderateScale(12),
        color: '#6B7280',
    },
    highlightsContainer: {
        gap: verticalScale(16),
    },
    highlightCard: {
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        padding: scale(16),
        borderRadius: scale(12),
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    highlightIcon: {
        width: scale(48),
        height: scale(48),
        borderRadius: scale(24),
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: scale(12),
    },
    highlightContent: {
        flex: 1,
    },
    highlightTitle: {
        fontSize: moderateScale(16),
        fontWeight: '600',
        color: '#1F2937',
        marginBottom: verticalScale(4),
    },
    highlightDescription: {
        fontSize: moderateScale(13),
        color: '#6B7280',
        lineHeight: moderateScale(18),
    },
    achievementsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: scale(12),
    },
    achievementCard: {
        backgroundColor: '#FFFFFF',
        padding: scale(16),
        borderRadius: scale(12),
        alignItems: 'center',
        width: (width - scale(52)) / 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    achievementIcon: {
        width: scale(56),
        height: scale(56),
        borderRadius: scale(28),
        backgroundColor: '#EFF6FF',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: verticalScale(12),
    },
    achievementNumber: {
        fontSize: moderateScale(24),
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: verticalScale(4),
    },
    achievementLabel: {
        fontSize: moderateScale(12),
        color: '#6B7280',
        textAlign: 'center',
    },
    ctaSection: {
        paddingHorizontal: scale(20),
        marginBottom: verticalScale(30),
    },
    ctaCard: {
        backgroundColor: '#FFFFFF',
        padding: scale(24),
        borderRadius: scale(20),
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 5,
    },
    ctaTitle: {
        fontSize: moderateScale(20),
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: verticalScale(8),
        textAlign: 'center',
    },
    ctaDescription: {
        fontSize: moderateScale(14),
        color: '#6B7280',
        lineHeight: moderateScale(20),
        textAlign: 'center',
        marginBottom: verticalScale(24),
    },
    ctaButtons: {
        gap: verticalScale(12),
        marginBottom: verticalScale(20),
    },
    primaryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#6366F1',
        paddingVertical: verticalScale(16),
        borderRadius: scale(12),
        gap: scale(8),
    },
    primaryButtonText: {
        fontSize: moderateScale(16),
        fontWeight: '600',
        color: '#FFFFFF',
    },
    secondaryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F3F4F6',
        paddingVertical: verticalScale(16),
        borderRadius: scale(12),
        gap: scale(8),
    },
    secondaryButtonText: {
        fontSize: moderateScale(16),
        fontWeight: '600',
        color: '#6366F1',
    },
    ctaFeatures: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingTop: verticalScale(16),
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
    },
    ctaFeature: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: scale(4),
    },
    ctaFeatureText: {
        fontSize: moderateScale(12),
        color: '#6B7280',
    },
});

export default DoctorIntroPage;